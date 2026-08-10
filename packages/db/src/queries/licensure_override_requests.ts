import { and, desc, eq, sql } from 'drizzle-orm';
import type { DrizzleDb } from '../client.js';
import { licensureOverrideRequests } from '../schema/licensure_override_requests.js';

export interface RecordOverrideRequestInput {
  draftId: string;
  state: string;
  requestedStatus: string;
  derivedStatus: string;
  rationale?: string | null;
  requestedBy?: string | null;
}

/**
 * Record a physician's request to override a derived status.
 *
 * `accepted` is computed here rather than passed in, because whether the gate
 * holds is not something a caller should be able to assert. The status comes
 * from date arithmetic on the records; a request that disagrees with it is
 * declined, and the only case where the two agree is a request for the status
 * the draft already carries.
 */
export async function recordOverrideRequest(
  db: DrizzleDb,
  tenantId: string,
  input: RecordOverrideRequestInput,
) {
  const accepted = input.requestedStatus === input.derivedStatus;
  const [row] = await db
    .insert(licensureOverrideRequests)
    .values({
      tenantId,
      draftId: input.draftId,
      state: input.state,
      requestedStatus: input.requestedStatus,
      derivedStatus: input.derivedStatus,
      rationale: input.rationale ?? null,
      accepted: accepted ? 'true' : 'false',
      requestedBy: input.requestedBy ?? null,
    })
    .returning();
  return row!;
}

export async function getOverrideRequestsByTenant(db: DrizzleDb, tenantId: string) {
  return db
    .select()
    .from(licensureOverrideRequests)
    .where(eq(licensureOverrideRequests.tenantId, tenantId))
    .orderBy(desc(licensureOverrideRequests.createdAt));
}

export async function getOverrideRequestsByDraft(
  db: DrizzleDb,
  tenantId: string,
  draftId: string,
) {
  return db
    .select()
    .from(licensureOverrideRequests)
    .where(
      and(
        eq(licensureOverrideRequests.tenantId, tenantId),
        eq(licensureOverrideRequests.draftId, draftId),
      ),
    )
    .orderBy(desc(licensureOverrideRequests.createdAt));
}

/**
 * The override metric, computed rather than parsed.
 *
 * The monitoring row commits to a threshold — more than 20% of a rolling 20
 * drafts overridden means the agent has lost calibration and the eval suite gets
 * re-run. That number has to come from somewhere countable, which is the whole
 * reason this table exists instead of a sentence in an audit label.
 */
export async function getOverrideStats(db: DrizzleDb, tenantId: string) {
  const rows = await db
    .select({
      total:    sql<number>`count(*)::int`,
      declined: sql<number>`count(*) filter (where ${licensureOverrideRequests.accepted} = 'false')::int`,
    })
    .from(licensureOverrideRequests)
    .where(eq(licensureOverrideRequests.tenantId, tenantId));

  const { total = 0, declined = 0 } = rows[0] ?? {};
  return {
    total,
    declined,
    /** Null rather than 0 when there is nothing to divide — no data is not a rate of zero. */
    declinedRate: total > 0 ? declined / total : null,
  };
}
