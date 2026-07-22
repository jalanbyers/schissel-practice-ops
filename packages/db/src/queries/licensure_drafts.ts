import { and, desc, eq } from 'drizzle-orm';
import { licensureDrafts } from '../schema/licensure_drafts.js';
import { NotFoundError } from '../errors.js';
import type { DrizzleDb } from '../client.js';
import type { NewLicensureDraft } from '../schema/licensure_drafts.js';

/**
 * Every query is scoped by tenantId, matching the rest of the data layer.
 * Cross-tenant reads return "not found" rather than "forbidden" so the error
 * is not an oracle for which records exist.
 */

export async function getDraftsByTenant(db: DrizzleDb, tenantId: string) {
  return db
    .select()
    .from(licensureDrafts)
    .where(eq(licensureDrafts.tenantId, tenantId))
    .orderBy(desc(licensureDrafts.createdAt));
}

export async function getDraftsByContract(
  db: DrizzleDb,
  tenantId: string,
  contractId: string,
) {
  return db
    .select()
    .from(licensureDrafts)
    .where(
      and(
        eq(licensureDrafts.tenantId, tenantId),
        eq(licensureDrafts.contractId, contractId),
      ),
    )
    .orderBy(desc(licensureDrafts.createdAt));
}

export async function getDraftById(db: DrizzleDb, tenantId: string, draftId: string) {
  const rows = await db
    .select()
    .from(licensureDrafts)
    .where(and(eq(licensureDrafts.tenantId, tenantId), eq(licensureDrafts.id, draftId)));
  if (rows.length === 0) throw new NotFoundError('Draft not found');
  return rows[0]!;
}

/**
 * Persist a run's results.
 *
 * `approvalStatus` is not accepted from the caller — a freshly analyzed state
 * is always pending. Allowing it to be set on insert would let a caller
 * fabricate an approved result without a physician ever seeing it, which is
 * exactly what the gate exists to prevent.
 */
export async function insertDrafts(
  db: DrizzleDb,
  tenantId: string,
  drafts: Array<
    Omit<
      NewLicensureDraft,
      'tenantId' | 'id' | 'createdAt' | 'updatedAt' | 'approvalStatus' | 'reviewedAt' | 'reviewedBy'
    >
  >,
): Promise<string[]> {
  if (drafts.length === 0) return [];
  const rows = await db
    .insert(licensureDrafts)
    .values(drafts.map((d) => ({ ...d, tenantId, approvalStatus: 'pending' as const })))
    .returning({ id: licensureDrafts.id });
  return rows.map((r) => r.id);
}

/**
 * Replace a contract's drafts with a fresh run.
 *
 * Re-analyzing supersedes the previous drafts rather than accumulating them,
 * so the physician is never reviewing two versions of the same state. Approved
 * rows are left alone — a completed review is not discarded by a re-run.
 */
export async function replacePendingDraftsForContract(
  db: DrizzleDb,
  tenantId: string,
  contractId: string,
): Promise<void> {
  await db
    .delete(licensureDrafts)
    .where(
      and(
        eq(licensureDrafts.tenantId, tenantId),
        eq(licensureDrafts.contractId, contractId),
        eq(licensureDrafts.approvalStatus, 'pending'),
      ),
    );
}
