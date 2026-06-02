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
import { NotFoundError } from '../errors.js';
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

beforeAll(async () => {
  // Use PGlite (in-process Postgres 16) — no Docker required.
  // CI uses testcontainers/postgresql via the separate ci-db job in workflow.
  ({ db, stop: stopDb } = await createPgliteDb());

  // Seed records belonging exclusively to tenant B.
  licenseId = await insertLicense(db, TENANT_B, { code: 'CA', name: 'California', status: 'active' });
  payerId = await insertPayer(db, TENANT_B, { name: 'Medicare (CMS)', type: 'Government', status: 'approved' });
  engagementId = await insertEngagement(db, TENANT_B, { name: 'Teladoc Health', model: 'Async visits', status: 'active' });
  taskId = await insertChecklistTask(db, TENANT_B, { task: 'HIPAA risk assessment', group: 'HIPAA', status: 'progress' });
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
