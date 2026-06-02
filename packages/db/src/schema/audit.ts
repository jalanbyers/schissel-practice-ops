import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Append-only audit log — one row per mutation, never deleted.
 * Mirrors the audit_log table in migrations/0000_initial.sql.
 */
export const auditLog = pgTable('audit_log', {
  id:       uuid('id').defaultRandom().primaryKey(),
  tenantId: text('tenant_id').notNull(),
  ts:       timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
  action:   text('action').notNull(),    // create | update | delete | toggle
  entity:   text('entity').notNull(),    // license | payer | engagement | ledger | task
  entityId: text('entity_id').notNull(),
  label:    text('label').notNull(),
  userId:   text('user_id'),             // Auth0 sub from JWT
  createdAt:timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type AuditLogRow = typeof auditLog.$inferSelect;
export type NewAuditLogRow = typeof auditLog.$inferInsert;
