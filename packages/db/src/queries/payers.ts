import { eq, and } from 'drizzle-orm';
import { payers } from '../schema/payers.js';
import { NotFoundError } from '../errors.js';
import type { DrizzleDb } from '../client.js';
import type { NewPayer } from '../schema/payers.js';

export async function getPayersByTenant(db: DrizzleDb, tenantId: string) {
  return db.select().from(payers).where(eq(payers.tenantId, tenantId));
}

export async function getPayerById(db: DrizzleDb, tenantId: string, payerId: string) {
  const rows = await db
    .select()
    .from(payers)
    .where(and(eq(payers.tenantId, tenantId), eq(payers.id, payerId)));
  if (rows.length === 0) throw new NotFoundError('Payer not found');
  return rows[0]!;
}

export async function insertPayer(
  db: DrizzleDb,
  tenantId: string,
  data: Omit<NewPayer, 'tenantId' | 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const rows = await db
    .insert(payers)
    .values({ ...data, tenantId })
    .returning({ id: payers.id });
  return rows[0]!.id;
}

export async function updatePayer(
  db: DrizzleDb,
  tenantId: string,
  payerId: string,
  data: Partial<Omit<NewPayer, 'tenantId' | 'id' | 'createdAt'>>,
) {
  const rows = await db
    .update(payers)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(payers.tenantId, tenantId), eq(payers.id, payerId)))
    .returning({ id: payers.id });
  if (rows.length === 0) throw new NotFoundError('Payer not found');
  return rows[0]!;
}

export async function deletePayer(db: DrizzleDb, tenantId: string, payerId: string) {
  const rows = await db
    .delete(payers)
    .where(and(eq(payers.tenantId, tenantId), eq(payers.id, payerId)))
    .returning({ id: payers.id });
  if (rows.length === 0) throw new NotFoundError('Payer not found');
}
