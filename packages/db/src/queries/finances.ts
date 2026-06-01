import { eq, and, desc } from 'drizzle-orm';
import { ledgerEntries, taxPayments } from '../schema/finances.js';
import { NotFoundError } from '../errors.js';
import type { DrizzleDb } from '../client.js';
import type { NewLedgerEntry, NewTaxPayment } from '../schema/finances.js';

// --- Ledger ---

export async function getLedgerByTenant(db: DrizzleDb, tenantId: string) {
  return db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.tenantId, tenantId))
    .orderBy(desc(ledgerEntries.date));
}

export async function getLedgerEntryById(db: DrizzleDb, tenantId: string, entryId: string) {
  const rows = await db
    .select()
    .from(ledgerEntries)
    .where(and(eq(ledgerEntries.tenantId, tenantId), eq(ledgerEntries.id, entryId)));
  if (rows.length === 0) throw new NotFoundError('Ledger entry not found');
  return rows[0]!;
}

export async function insertLedgerEntry(
  db: DrizzleDb,
  tenantId: string,
  data: Omit<NewLedgerEntry, 'tenantId' | 'id' | 'createdAt'>,
): Promise<string> {
  const rows = await db
    .insert(ledgerEntries)
    .values({ ...data, tenantId })
    .returning({ id: ledgerEntries.id });
  return rows[0]!.id;
}

export async function deleteLedgerEntry(db: DrizzleDb, tenantId: string, entryId: string) {
  const rows = await db
    .delete(ledgerEntries)
    .where(and(eq(ledgerEntries.tenantId, tenantId), eq(ledgerEntries.id, entryId)))
    .returning({ id: ledgerEntries.id });
  if (rows.length === 0) throw new NotFoundError('Ledger entry not found');
}

// --- Tax payments ---

export async function getTaxPaymentsByTenant(db: DrizzleDb, tenantId: string) {
  return db.select().from(taxPayments).where(eq(taxPayments.tenantId, tenantId));
}

export async function getTaxPaymentById(db: DrizzleDb, tenantId: string, paymentId: string) {
  const rows = await db
    .select()
    .from(taxPayments)
    .where(and(eq(taxPayments.tenantId, tenantId), eq(taxPayments.id, paymentId)));
  if (rows.length === 0) throw new NotFoundError('Tax payment not found');
  return rows[0]!;
}

export async function upsertTaxPayment(
  db: DrizzleDb,
  tenantId: string,
  data: Omit<NewTaxPayment, 'tenantId' | 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const rows = await db
    .insert(taxPayments)
    .values({ ...data, tenantId })
    .returning({ id: taxPayments.id });
  return rows[0]!.id;
}

export async function markTaxPaymentPaid(
  db: DrizzleDb,
  tenantId: string,
  paymentId: string,
  paidAmount: string,
) {
  const rows = await db
    .update(taxPayments)
    .set({ paid: true, paidAmount, updatedAt: new Date() })
    .where(and(eq(taxPayments.tenantId, tenantId), eq(taxPayments.id, paymentId)))
    .returning({ id: taxPayments.id });
  if (rows.length === 0) throw new NotFoundError('Tax payment not found');
}
