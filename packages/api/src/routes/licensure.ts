import type { FastifyPluginAsync } from 'fastify';
import type { DrizzleDb } from '@schissel/db';
import {
  getDraftsByContract,
  getDraftsByTenant,
  insertDrafts,
  replacePendingDraftsForContract,
} from '@schissel/db';
import { requireRole } from '../plugins/rbac.js';

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

    await replacePendingDraftsForContract(db, request.tenantId, contractId);

    const ids = await insertDrafts(
      db,
      request.tenantId,
      analyzed.map((r) => ({
        contractId,
        state: r.state,
        plannedCareDate,
        payload: r.result as Record<string, unknown>,
      })),
    );

    return reply.status(201).send({
      contractId,
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
};
