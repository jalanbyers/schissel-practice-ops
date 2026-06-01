import { pgTable, text, timestamp, uuid, numeric, boolean } from 'drizzle-orm/pg-core';

export const INCOME_CATEGORIES = ['Clinical', 'Consulting', 'Platform', 'Other income'] as const;
export const EXPENSE_CATEGORIES = ['Insurance', 'Licensing', 'Services', 'Software', 'Education', 'Other'] as const;

export const ledgerEntries = pgTable('ledger_entries', {
  id:        uuid('id').defaultRandom().primaryKey(),
  tenantId:  text('tenant_id').notNull(),
  date:      text('date').notNull(),
  type:      text('type', { enum: ['income', 'expense'] }).notNull(),
  category:  text('category').notNull(),
  source:    text('source').notNull(),
  amount:    numeric('amount', { precision: 12, scale: 2 }).notNull(),
  note:      text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type NewLedgerEntry = typeof ledgerEntries.$inferInsert;

export const taxPayments = pgTable('tax_payments', {
  id:          uuid('id').defaultRandom().primaryKey(),
  tenantId:    text('tenant_id').notNull(),
  label:       text('label').notNull(),   // e.g. "Q1 2026"
  due:         text('due').notNull(),     // ISO date string
  paid:        boolean('paid').notNull().default(false),
  paidAmount:  numeric('paid_amount', { precision: 12, scale: 2 }),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type TaxPayment = typeof taxPayments.$inferSelect;
export type NewTaxPayment = typeof taxPayments.$inferInsert;
