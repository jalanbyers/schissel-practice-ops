/**
 * Cross-tenant denial tests — written before any application code.
 * These are the executable spec for the tenant isolation rule:
 *
 *   Every query is scoped by tenant_id.
 *   The application layer is the authoritative gate.
 *   A cross-tenant request must fail — indistinguishably from "not found."
 *
 * A passing test suite here means the data layer cannot be used unsafely.
 * No test in this file should be skipped or weakened without team sign-off.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AlreadyReviewedError, NotFoundError } from '../errors.js';
import { createPgliteDb } from './helpers/create-pglite-db.js';

import {
  getLicensesByTenant,
  getLicenseById,
  insertLicense,
  deleteLicense,
} from '../queries/licenses.js';
import {
  getPayersByTenant,
  getPayerById,
  insertPayer,
} from '../queries/payers.js';
import {
  getEngagementsByTenant,
  getEngagementById,
  insertEngagement,
} from '../queries/engagements.js';
import {
  getDraftsByTenant,
  getDraftsByContract,
  getDraftById,
  insertDrafts,
  deleteDraftsByIds,
  reviewDraft,
} from '../queries/licensure_drafts.js';
import {
  recordOverrideRequest,
  getOverrideRequestsByTenant,
  getOverrideStats,
} from '../queries/licensure_override_requests.js';
import {
  getChecklistByTenant,
  getChecklistTaskById,
  insertChecklistTask,
} from '../queries/checklist.js';
import {
  getLedgerByTenant,
  getLedgerEntryById,
  insertLedgerEntry,
} from '../queries/finances.js';
import {
  getSettings,
  upsertSettings,
} from '../queries/settings.js';

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const TENANT_A = 'tenant-aaaaaaaa';
const TENANT_B = 'tenant-bbbbbbbb';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
let stopDb: () => Promise<void>;

// IDs of records seeded under tenant B — tenant A will attempt to access them.
let licenseId: string;
let payerId: string;
let engagementId: string;
let taskId: string;
let ledgerEntryId: string;
let draftId: string;

beforeAll(async () => {
  // Use PGlite (in-process Postgres 16) — no Docker required.
  // CI uses testcontainers/postgresql via the separate ci-db job in workflow.
  ({ db, stop: stopDb } = await createPgliteDb());

  // Seed records belonging exclusively to tenant B.
  licenseId = await insertLicense(db, TENANT_B, { code: 'CA', name: 'California', status: 'active' });
  payerId = await insertPayer(db, TENANT_B, { name: 'Medicare (CMS)', type: 'Government', status: 'approved' });
  engagementId = await insertEngagement(db, TENANT_B, { name: 'Teladoc Health', model: 'Async visits', status: 'active' });
  taskId = await insertChecklistTask(db, TENANT_B, { task: 'HIPAA risk assessment', group: 'HIPAA', status: 'progress' });
  [draftId] = await insertDrafts(db, TENANT_B, [{
    contractId: 'SYN-CONTRACT-1001',
    state: 'OH',
    plannedCareDate: '2026-10-01',
    payload: { state: 'OH', status: 'human_review_required' },
  }]) as [string];
  ledgerEntryId = await insertLedgerEntry(db, TENANT_B, { date: '2026-06-01', type: 'income', category: 'Clinical', source: 'Teladoc', amount: '4800' });
  await upsertSettings(db, TENANT_B, { name: 'Schissel Medicine', entity: 'Schissel Medicine, PLLC' });
});

afterAll(async () => {
  await stopDb();
});

// ---------------------------------------------------------------------------
// Licenses
// ---------------------------------------------------------------------------

describe('licenses — tenant isolation', () => {
  it('owner (tenant B) can read its own license', async () => {
    const row = await getLicenseById(db, TENANT_B, licenseId);
    expect(row.id).toBe(licenseId);
    expect(row.tenantId).toBe(TENANT_B);
  });

  it('cross-tenant get-by-id throws NotFoundError — not a data leak', async () => {
    await expect(getLicenseById(db, TENANT_A, licenseId)).rejects.toThrow(NotFoundError);
  });

  it('cross-tenant get-by-id error message is identical to missing-record error', async () => {
    const phantomId = '00000000-0000-0000-0000-000000000000';
    const [errWrongTenant, errMissing] = await Promise.all([
      getLicenseById(db, TENANT_A, licenseId).catch((e: Error) => e.message),
      getLicenseById(db, TENANT_A, phantomId).catch((e: Error) => e.message),
    ]);
    // Same message — cross-tenant access is indistinguishable from "not found"
    expect(errWrongTenant).toBe(errMissing);
  });

  it('list query for tenant A returns zero rows even though DB has records', async () => {
    const rows = await getLicensesByTenant(db, TENANT_A);
    expect(rows).toHaveLength(0);
  });

  it('list query for tenant B returns only its own records', async () => {
    // Add a second license under tenant A to prove lists don't bleed across
    await insertLicense(db, TENANT_A, { code: 'NH', name: 'New Hampshire', status: 'active' });
    const rowsB = await getLicensesByTenant(db, TENANT_B);
    expect(rowsB.every((r) => r.tenantId === TENANT_B)).toBe(true);
  });

  it('cross-tenant delete silently fails as NotFoundError — cannot delete another tenants record', async () => {
    await expect(deleteLicense(db, TENANT_A, licenseId)).rejects.toThrow(NotFoundError);
    // Record must still exist for tenant B
    const row = await getLicenseById(db, TENANT_B, licenseId);
    expect(row.id).toBe(licenseId);
  });
});

// ---------------------------------------------------------------------------
// Payers
// ---------------------------------------------------------------------------

describe('payers — tenant isolation', () => {
  it('cross-tenant get-by-id throws NotFoundError', async () => {
    await expect(getPayerById(db, TENANT_A, payerId)).rejects.toThrow(NotFoundError);
  });

  it('cross-tenant list returns empty', async () => {
    const rows = await getPayersByTenant(db, TENANT_A);
    expect(rows).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Engagements
// ---------------------------------------------------------------------------

describe('engagements — tenant isolation', () => {
  it('cross-tenant get-by-id throws NotFoundError', async () => {
    await expect(getEngagementById(db, TENANT_A, engagementId)).rejects.toThrow(NotFoundError);
  });

  it('cross-tenant list returns empty', async () => {
    const rows = await getEngagementsByTenant(db, TENANT_A);
    expect(rows).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Checklist tasks
// ---------------------------------------------------------------------------

describe('checklist — tenant isolation', () => {
  it('cross-tenant get-by-id throws NotFoundError', async () => {
    await expect(getChecklistTaskById(db, TENANT_A, taskId)).rejects.toThrow(NotFoundError);
  });

  it('cross-tenant list returns empty', async () => {
    const rows = await getChecklistByTenant(db, TENANT_A);
    expect(rows).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Finances — ledger entries
// ---------------------------------------------------------------------------

describe('finances — tenant isolation', () => {
  it('cross-tenant get-by-id throws NotFoundError', async () => {
    await expect(getLedgerEntryById(db, TENANT_A, ledgerEntryId)).rejects.toThrow(NotFoundError);
  });

  it('cross-tenant list returns empty', async () => {
    const rows = await getLedgerByTenant(db, TENANT_A);
    expect(rows).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Settings — one record per tenant
// ---------------------------------------------------------------------------

describe('settings — tenant isolation', () => {
  it('tenant A settings are null when only tenant B has a settings row', async () => {
    const row = await getSettings(db, TENANT_A);
    expect(row).toBeNull();
  });

  it('tenant B settings are not visible to tenant A', async () => {
    const rowB = await getSettings(db, TENANT_B);
    const rowA = await getSettings(db, TENANT_A);
    expect(rowB?.name).toBe('Schissel Medicine');
    expect(rowA).toBeNull();
  });

  it('tenant A upsert does not overwrite tenant B settings', async () => {
    await upsertSettings(db, TENANT_A, { name: 'Impersonator Practice' });
    const rowB = await getSettings(db, TENANT_B);
    expect(rowB?.name).toBe('Schissel Medicine');
  });
});

// ---------------------------------------------------------------------------
// Licensure drafts — physician review decisions, so cross-tenant leakage here
// would expose one practice's licensure posture to another.
// ---------------------------------------------------------------------------

describe('licensure drafts — tenant isolation', () => {
  it('listing returns nothing for a tenant with no drafts', async () => {
    const rows = await getDraftsByTenant(db, TENANT_A);
    expect(rows).toHaveLength(0);
  });

  it('listing by contract does not cross tenants', async () => {
    const rows = await getDraftsByContract(db, TENANT_A, 'SYN-CONTRACT-1001');
    expect(rows).toHaveLength(0);
  });

  it("fetching another tenant's draft by id fails as not-found", async () => {
    await expect(getDraftById(db, TENANT_A, draftId)).rejects.toThrow(NotFoundError);
  });

  it('the owning tenant can read its own draft', async () => {
    const row = await getDraftById(db, TENANT_B, draftId);
    expect(row.state).toBe('OH');
    expect(row.tenantId).toBe(TENANT_B);
  });

  it('inserted drafts are always pending — approval cannot be set on insert', async () => {
    const [id] = await insertDrafts(db, TENANT_B, [{
      contractId: 'SYN-CONTRACT-2002',
      state: 'CA',
      plannedCareDate: '2026-10-01',
      // A caller trying to smuggle an approved status past the gate.
      approvalStatus: 'approved',
      payload: { state: 'CA', status: 'license_current' },
    } as never]);
    const row = await getDraftById(db, TENANT_B, id!);
    expect(row.approvalStatus).toBe('pending');
  });
});

// ---------------------------------------------------------------------------
// The approval gate. These are the transitions that decide whether a
// machine-generated licensure assessment becomes something a physician has
// signed off on, so the rules matter more than the happy path.
// ---------------------------------------------------------------------------

describe('licensure drafts — approval gate', () => {
  async function seedPending(state = 'CA') {
    const [id] = await insertDrafts(db, TENANT_B, [{
      contractId: 'SYN-CONTRACT-GATE',
      state,
      plannedCareDate: '2026-10-01',
      payload: { state, status: 'license_current' },
    }]);
    return id!;
  }

  it('approving moves a pending draft to approved and stamps the reviewer', async () => {
    const id = await seedPending('CA');
    const { updated } = await reviewDraft(db, TENANT_B, id, {
      decision: 'approve', reviewedBy: 'user-1',
    });
    expect(updated.approvalStatus).toBe('approved');
    expect(updated.reviewedBy).toBe('user-1');
    expect(updated.reviewedAt).not.toBeNull();
  });

  // The settled-vs-outstanding distinction. Approving `license_current` means
  // "confirmed fine"; approving `renewal_needed` means "confirmed I have a
  // problem". Conflating them made a live problem go silent the moment it was
  // acknowledged, so re-analysis never surfaced it again.
  describe('superseding a decided draft', () => {
    async function seedDecided(state: string, status: string, decision: 'approve' | 'reject' | 'escalate') {
      const [id] = await insertDrafts(db, TENANT_B, [{
        contractId: 'SYN-CONTRACT-SUP',
        state,
        plannedCareDate: '2026-10-01',
        payload: { state, status },
      }]);
      await reviewDraft(db, TENANT_B, id!, { decision, reviewedBy: 'user-1' });
      return id!;
    }

    it('deletes only the ids given, and only within the tenant', async () => {
      const keep = await seedDecided('NV', 'renewal_needed', 'approve');
      const drop = await seedDecided('UT', 'renewal_needed', 'approve');

      expect(await deleteDraftsByIds(db, TENANT_A, [drop])).toBe(0);
      await expect(getDraftById(db, TENANT_B, drop)).resolves.toBeTruthy();

      expect(await deleteDraftsByIds(db, TENANT_B, [drop])).toBe(1);
      await expect(getDraftById(db, TENANT_B, drop)).rejects.toThrow(NotFoundError);
      await expect(getDraftById(db, TENANT_B, keep)).resolves.toBeTruthy();
    });

    it('is a no-op on an empty id list', async () => {
      expect(await deleteDraftsByIds(db, TENANT_B, [])).toBe(0);
    });

    it('an approved license_current draft is settled; an approved problem is not', async () => {
      const settled = await seedDecided('WY', 'license_current', 'approve');
      const outstanding = await seedDecided('ID', 'renewal_needed', 'approve');

      const isSettled = (d: { approvalStatus: string; payload: unknown }) =>
        d.approvalStatus === 'approved' &&
        (d.payload as Record<string, unknown>)?.['status'] === 'license_current';

      expect(isSettled(await getDraftById(db, TENANT_B, settled))).toBe(true);
      expect(isSettled(await getDraftById(db, TENANT_B, outstanding))).toBe(false);
    });

    it('rejected and escalated drafts are never settled', async () => {
      const rejected  = await seedDecided('OK', 'license_current', 'reject');
      const escalated = await seedDecided('KS', 'license_current', 'escalate');
      for (const id of [rejected, escalated]) {
        const d = await getDraftById(db, TENANT_B, id);
        expect(d.approvalStatus).not.toBe('approved');
      }
    });
  });

  // Faculty asked for two things that turn out to be one feature: capture the
  // override data before the pilot that exists to collect it, and put the
  // decline on screen where the consequence lives. A row here is both.
  describe('override requests', () => {
    async function seedFor(state: string, status: string) {
      const [id] = await insertDrafts(db, TENANT_B, [{
        contractId: 'SYN-CONTRACT-OVR',
        state,
        plannedCareDate: '2026-10-01',
        payload: { state, status, status_rationale: 'expires before the care date' },
      }]);
      return id!;
    }

    it('declines a request that disagrees with the derived status', async () => {
      const id = await seedFor('FL', 'renewal_needed');
      const row = await recordOverrideRequest(db, TENANT_B, {
        draftId: id, state: 'FL',
        requestedStatus: 'license_current',
        derivedStatus: 'renewal_needed',
        rationale: 'expires before the care date',
        requestedBy: 'user-1',
      });
      expect(row.accepted).toBe('false');
      expect(row.requestedStatus).toBe('license_current');
      expect(row.derivedStatus).toBe('renewal_needed');
    });

    it('acceptance is computed, not caller-supplied', async () => {
      // The caller cannot assert that the gate held. Same status in both
      // fields is the only way `accepted` is ever true.
      const id = await seedFor('CA', 'license_current');
      const row = await recordOverrideRequest(db, TENANT_B, {
        draftId: id, state: 'CA',
        requestedStatus: 'license_current',
        derivedStatus: 'license_current',
        requestedBy: 'user-1',
      });
      expect(row.accepted).toBe('true');
    });

    it('is tenant-scoped', async () => {
      const id = await seedFor('TX', 'new_application_needed');
      await recordOverrideRequest(db, TENANT_B, {
        draftId: id, state: 'TX',
        requestedStatus: 'license_current',
        derivedStatus: 'new_application_needed',
        requestedBy: 'user-1',
      });
      expect(await getOverrideRequestsByTenant(db, TENANT_A)).toHaveLength(0);
      expect((await getOverrideRequestsByTenant(db, TENANT_B)).length).toBeGreaterThan(0);
    });

    it('produces the rate the monitoring threshold is defined against', async () => {
      const stats = await getOverrideStats(db, TENANT_B);
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.declined).toBeGreaterThan(0);
      expect(stats.declinedRate).toBeGreaterThan(0);
      expect(stats.declinedRate).toBeLessThanOrEqual(1);
    });

    it('reports no rate rather than a rate of zero when there is no data', async () => {
      // "0%" and "nothing happened yet" mean different things to a threshold.
      const stats = await getOverrideStats(db, TENANT_A);
      expect(stats.total).toBe(0);
      expect(stats.declinedRate).toBeNull();
    });
  });

  it('a decided draft cannot be decided again', async () => {
    const id = await seedPending('TX');
    await reviewDraft(db, TENANT_B, id, { decision: 'approve', reviewedBy: 'user-1' });
    await expect(
      reviewDraft(db, TENANT_B, id, { decision: 'reject', reviewedBy: 'user-2' }),
    ).rejects.toThrow(AlreadyReviewedError);
  });

  it('rejecting keeps the note and does not approve', async () => {
    const id = await seedPending('NC');
    const { updated } = await reviewDraft(db, TENANT_B, id, {
      decision: 'reject', reviewedBy: 'user-1', note: 'superseded by a new contract',
    });
    expect(updated.approvalStatus).toBe('rejected');
    expect(updated.reviewNote).toBe('superseded by a new contract');
  });

  it('escalating is its own state, not an approval', async () => {
    const id = await seedPending('OH');
    const { updated } = await reviewDraft(db, TENANT_B, id, {
      decision: 'escalate', reviewedBy: 'user-1', note: 'sent to licensing counsel',
    });
    expect(updated.approvalStatus).toBe('escalated');
  });

  it('an edit stores the corrected payload and returns the original for audit', async () => {
    const id = await seedPending('FL');
    const { previous, updated } = await reviewDraft(db, TENANT_B, id, {
      decision: 'edit',
      reviewedBy: 'user-1',
      editedPayload: { state: 'FL', status: 'renewal_needed' },
    });
    // Both sides are available so the audit entry can say what changed.
    expect((previous.payload as Record<string, unknown>)['status']).toBe('license_current');
    expect((updated.payload as Record<string, unknown>)['status']).toBe('renewal_needed');
    expect(updated.approvalStatus).toBe('approved');
  });

  it("a tenant cannot decide another tenant's draft", async () => {
    const id = await seedPending('AZ');
    await expect(
      reviewDraft(db, TENANT_A, id, { decision: 'approve', reviewedBy: 'attacker' }),
    ).rejects.toThrow(NotFoundError);
    // And it is still pending for the owner.
    const row = await getDraftById(db, TENANT_B, id);
    expect(row.approvalStatus).toBe('pending');
  });
});
