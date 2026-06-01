import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import type { Requirement, Document } from './licenses.js';

export const ENG_MODELS = ['Async visits', 'Scheduled video', 'On-demand', 'Panel/retainer', 'Direct cash', 'Other'] as const;
export type EngModel = typeof ENG_MODELS[number];

export const engagements = pgTable('engagements', {
  id:           uuid('id').defaultRandom().primaryKey(),
  tenantId:     text('tenant_id').notNull(),
  name:         text('name').notNull(),
  model:        text('model', { enum: ENG_MODELS }).notNull().default('Other'),
  volume:       text('volume'),
  rate:         text('rate'),
  status:       text('status', { enum: ['active', 'hold', 'prospect', 'ended'] }).notNull().default('prospect'),
  startDate:    text('start_date'),
  contact:      text('contact'),
  portalUrl:    text('portal_url'),
  payTerms:     text('pay_terms'),
  notes:        text('notes'),
  requirements: jsonb('requirements').$type<Requirement[]>().notNull().default([]),
  documents:    jsonb('documents').$type<Document[]>().notNull().default([]),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Engagement = typeof engagements.$inferSelect;
export type NewEngagement = typeof engagements.$inferInsert;
