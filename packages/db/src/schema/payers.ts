import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import type { Requirement, Document } from './licenses.js';

export const PAYER_TYPES = ['Commercial', 'Government', 'Platform', 'Clearinghouse', 'Profile', 'Other'] as const;
export type PayerType = typeof PAYER_TYPES[number];

export const payers = pgTable('payers', {
  id:            uuid('id').defaultRandom().primaryKey(),
  tenantId:      text('tenant_id').notNull(),
  name:          text('name').notNull(),
  type:          text('type', { enum: PAYER_TYPES }).notNull().default('Commercial'),
  status:        text('status', { enum: ['notstarted', 'submitted', 'review', 'approved'] }).notNull().default('notstarted'),
  date:          text('date'),
  effectiveDate: text('effective_date'),
  revalidation:  text('revalidation'),
  providerId:    text('provider_id'),
  rep:           text('rep'),
  portalUrl:     text('portal_url'),
  notes:         text('notes'),
  requirements:  jsonb('requirements').$type<Requirement[]>().notNull().default([]),
  documents:     jsonb('documents').$type<Document[]>().notNull().default([]),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Payer = typeof payers.$inferSelect;
export type NewPayer = typeof payers.$inferInsert;
