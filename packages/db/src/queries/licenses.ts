import { eq, and } from 'drizzle-orm';
import { licenses } from '../schema/licenses.js';
import { NotFoundError } from '../errors.js';
import type { DrizzleDb } from '../client.js';
import type { NewLicense } from '../schema/licenses.js';

export async function getLicensesByTenant(db: DrizzleDb, tenantId: string) {
  return db.select().from(licenses).where(eq(licenses.tenantId, tenantId));
}

export async function getLicenseById(db: DrizzleDb, tenantId: string, licenseId: string) {
  const rows = await db
    .select()
    .from(licenses)
    .where(and(eq(licenses.tenantId, tenantId), eq(licenses.id, licenseId)));
  // Return identical error for "not found" and "wrong tenant" — no oracle attack.
  if (rows.length === 0) throw new NotFoundError('License not found');
  return rows[0]!;
}

export async function insertLicense(
  db: DrizzleDb,
  tenantId: string,
  data: Omit<NewLicense, 'tenantId' | 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const rows = await db
    .insert(licenses)
    .values({ ...data, tenantId })
    .returning({ id: licenses.id });
  return rows[0]!.id;
}

export async function updateLicense(
  db: DrizzleDb,
  tenantId: string,
  licenseId: string,
  data: Partial<Omit<NewLicense, 'tenantId' | 'id' | 'createdAt'>>,
) {
  const rows = await db
    .update(licenses)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(licenses.tenantId, tenantId), eq(licenses.id, licenseId)))
    .returning({ id: licenses.id });
  if (rows.length === 0) throw new NotFoundError('License not found');
  return rows[0]!;
}

/** Look up a license by state code (unique per tenant). */
export async function getLicenseByCode(db: DrizzleDb, tenantId: string, code: string) {
  const rows = await db
    .select()
    .from(licenses)
    .where(and(eq(licenses.tenantId, tenantId), eq(licenses.code, code)));
  if (rows.length === 0) throw new NotFoundError('License not found');
  return rows[0]!;
}

export async function updateLicenseByCode(
  db: DrizzleDb,
  tenantId: string,
  code: string,
  data: Partial<Omit<NewLicense, 'tenantId' | 'id' | 'createdAt'>>,
) {
  const rows = await db
    .update(licenses)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(licenses.tenantId, tenantId), eq(licenses.code, code)))
    .returning({ id: licenses.id });
  if (rows.length === 0) throw new NotFoundError('License not found');
  return rows[0]!;
}

export async function deleteLicenseByCode(db: DrizzleDb, tenantId: string, code: string) {
  const rows = await db
    .delete(licenses)
    .where(and(eq(licenses.tenantId, tenantId), eq(licenses.code, code)))
    .returning({ id: licenses.id });
  if (rows.length === 0) throw new NotFoundError('License not found');
}

export async function deleteLicense(db: DrizzleDb, tenantId: string, licenseId: string) {
  const rows = await db
    .delete(licenses)
    .where(and(eq(licenses.tenantId, tenantId), eq(licenses.id, licenseId)))
    .returning({ id: licenses.id });
  if (rows.length === 0) throw new NotFoundError('License not found');
}
