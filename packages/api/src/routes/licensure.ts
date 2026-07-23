import type { FastifyPluginAsync } from 'fastify';
import type { DrizzleDb } from '@schissel/db';
import {
  AlreadyReviewedError,
  NotFoundError,
  getDraftById,
  getDraftsByContract,
  getDraftsByTenant,
  insertAuditEvent,
  insertDrafts,
  replacePendingDraftsForContract,
  reviewDraft,
  type ReviewDecision,
} from '@schissel/db';
import { requireMfa, requireRole } from '../plugins/rbac.js';

const DECISIONS: ReviewDecision[] = ['approve', 'edit', 'reject', 'escalate'];

/**
 * Licensure analyst routes.
 *
 * The agent runs as a separate service — locally `uv run uvicorn
 * app.local_server:app --port 8080`, in production the Cloud Run deployment.
 * This route only knows a base URL.
 *
 * Everything the agent returns is stored as a draft. There is deliberately no
 * endpoint here that writes an approved result: the approval gate
 * (DESIGN_SPEC §8) means only a physician action can move a draft out of
 * `pending`, and that lands in slice 2.
 */

const AGENT_URL = process.env['LICENSURE_AGENT_URL'] ?? 'http://localhost:8080';
const ANALYZE_TIMEOUT_MS = 120_000;

interface AgentStateResult {
  state: string;
  result?: Record<string, unknown> | null;
  raw?: string | null;
  error?: string | null;
}

interface AgentResponse {
  contract_id: string;
  planned_care_date: string;
  results: AgentStateResult[];
}

export const licensureRoutes: FastifyPluginAsync<{ db: DrizzleDb }> = async (fastify, { db }) => {
  /**
   * Run the agent over a contract's required states and store the drafts.
   *
   * Re-analyzing supersedes previous *pending* drafts for the contract so the
   * physician never sees two versions of one state. Approved drafts survive —
   * a completed review is not thrown away by a re-run.
   */
  fastify.post<{
    Body: { contractId?: string; states?: string[]; plannedCareDate?: string };
  }>('/analyze', {
    preHandler: [requireRole('owner', 'admin')],
  }, async (request, reply) => {
    const { contractId, states, plannedCareDate } = request.body ?? {};

    if (!contractId || !Array.isArray(states) || states.length === 0 || !plannedCareDate) {
      return reply.status(400).send({
        error: 'contractId, states (non-empty array) and plannedCareDate are required',
      });
    }

    let agent: AgentResponse;
    try {
      const response = await fetch(`${AGENT_URL}/analyze`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contract_id: contractId,
          states,
          planned_care_date: plannedCareDate,
        }),
        signal: AbortSignal.timeout(ANALYZE_TIMEOUT_MS),
      });

      if (!response.ok) {
        const detail = await response.text();
        request.log.error({ status: response.status, detail }, 'licensure agent returned an error');
        return reply.status(502).send({
          error: `Licensure agent returned ${response.status}`,
        });
      }
      agent = (await response.json()) as AgentResponse;
    } catch (err) {
      // A timeout or a refused connection is an operational failure, not a
      // clinical one. Say so plainly rather than surfacing a partial result
      // that could be mistaken for an analysis.
      request.log.error({ err, agentUrl: AGENT_URL }, 'could not reach the licensure agent');
      return reply.status(503).send({
        error: 'Licensure agent is unavailable. No analysis was recorded.',
      });
    }

    const analyzed = agent.results.filter((r) => r.result && !r.error);
    const failed = agent.results.filter((r) => !r.result || r.error);

    // A state the physician has already decided (approved / rejected /
    // escalated) is not re-drafted. replacePendingDraftsForContract clears only
    // pending rows, so without this guard a re-analysis would leave the old
    // decided draft AND insert a fresh pending one — two cards for the same
    // state. Skipping preserves the decision rather than silently discarding
    // it; a decided state that genuinely needs re-analysis is a deliberate
    // re-open, not a side effect of clicking Analyze again.
    const existing = await getDraftsByContract(db, request.tenantId, contractId);
    const decided = new Set(
      existing.filter((d) => d.approvalStatus !== 'pending').map((d) => d.state),
    );

    await replacePendingDraftsForContract(db, request.tenantId, contractId);

    const toInsert = analyzed.filter((r) => !decided.has(r.state));
    const ids = await insertDrafts(
      db,
      request.tenantId,
      toInsert.map((r) => ({
        contractId,
        state: r.state,
        plannedCareDate,
        payload: r.result as Record<string, unknown>,
      })),
    );

    const skipped = analyzed
      .filter((r) => decided.has(r.state))
      .map((r) => r.state);

    return reply.status(201).send({
      contractId,
      skipped,
      plannedCareDate,
      created: ids.length,
      // Reported rather than hidden: a state the agent could not analyze is
      // one the physician still has to deal with.
      failed: failed.map((r) => ({ state: r.state, error: r.error ?? 'no result returned' })),
    });
  });

  /** All drafts for the tenant, or for one contract via ?contractId=. */
  fastify.get<{ Querystring: { contractId?: string } }>('/drafts', async (request) => {
    const { contractId } = request.query;
    return contractId
      ? getDraftsByContract(db, request.tenantId, contractId)
      : getDraftsByTenant(db, request.tenantId);
  });

  /**
   * Record a physician's decision on a draft — the approval gate.
   *
   * Gated on role AND MFA. This is the moment a machine-generated licensure
   * assessment becomes something a physician has signed off on, which is the
   * highest-consequence write in this feature.
   *
   * Deliberately there is still no path that lets the AGENT reach this. The
   * decision requires an authenticated human with a verified second factor.
   */
  fastify.patch<{
    Params: { id: string };
    Body: { decision?: string; note?: string; payload?: Record<string, unknown> };
  }>('/drafts/:id', {
    preHandler: [requireRole('owner', 'admin'), requireMfa()],
  }, async (request, reply) => {
    const { decision, note, payload } = request.body ?? {};

    if (!decision || !DECISIONS.includes(decision as ReviewDecision)) {
      return reply.status(400).send({
        error: `decision must be one of ${DECISIONS.join(', ')}`,
      });
    }
    if (decision === 'edit' && (!payload || typeof payload !== 'object')) {
      return reply.status(400).send({
        error: 'an edit must include the corrected payload',
      });
    }

    try {
      const { previous, updated } = await reviewDraft(db, request.tenantId, request.params.id, {
        decision: decision as ReviewDecision,
        reviewedBy: request.userId,
        note: note ?? null,
        editedPayload: decision === 'edit' ? payload! : null,
      });

      // Audit the decision, not just the outcome. An edit that changes the
      // status is the one case where the record no longer says what the agent
      // said, so the label records both sides.
      const before = String((previous.payload as Record<string, unknown>)?.['status'] ?? 'unknown');
      const after = String((updated.payload as Record<string, unknown>)?.['status'] ?? 'unknown');
      const label =
        decision === 'edit' && before !== after
          ? `${updated.state}: approved with edits — agent said ${before}, physician recorded ${after}`
          : `${updated.state}: ${decision} (${after})`;

      await insertAuditEvent(db, request.tenantId, {
        action: `licensure.${decision}`,
        entity: 'licensure_draft',
        entityId: updated.id,
        label,
        userId: request.userId,
      });

      return updated;
    } catch (err) {
      if (err instanceof AlreadyReviewedError) {
        return reply.status(409).send({ error: err.message });
      }
      if (err instanceof NotFoundError) {
        return reply.status(404).send({ error: err.message });
      }
      throw err;
    }
  });

  /** A single draft, tenant-scoped. */
  fastify.get<{ Params: { id: string } }>('/drafts/:id', async (request, reply) => {
    try {
      return await getDraftById(db, request.tenantId, request.params.id);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.status(404).send({ error: err.message });
      throw err;
    }
  });
};
