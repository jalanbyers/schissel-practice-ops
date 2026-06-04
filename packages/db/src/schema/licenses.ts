import { pgTable, text, boolean, timestamp, uuid, jsonb, integer } from 'drizzle-orm/pg-core';

export type Requirement = { id: string; label: string; done: boolean };
export type Document = { id: string; name: string; note: string };

export const licenses = pgTable('licenses', {
  id:          uuid('id').defaultRandom().primaryKey(),
  tenantId:    text('tenant_id').notNull(),
  code:        text('code').notNull(),
  name:        text('name').notNull(),
  status:      text('status', { enum: ['active', 'progress', 'expiring', 'none'] }).notNull().default('none'),
  imlc:        boolean('imlc').notNull().default(false),
  home:        boolean('home').notNull().default(false),
  licenseNo:   text('license_no'),
  issued:      text('issued'),
  expires:     text('expires'),
  cycle:       text('cycle', { enum: ['Annual', 'Biennial', 'Triennial'] }),
  fee:              text('fee'),
  applicationFee:   text('application_fee'),
  timeline:         text('timeline'),
  cmeHours:         integer('cme_hours'),
  telehealthNotes:  text('telehealth_notes'),
  board:       text('board'),
  boardUrl:    text('board_url'),
  notes:       text('notes'),
  requirements: jsonb('requirements').$type<Requirement[]>().notNull().default([]),
  documents:   jsonb('documents').$type<Document[]>().notNull().default([]),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type License = typeof licenses.$inferSelect;
export type NewLicense = typeof licenses.$inferInsert;
