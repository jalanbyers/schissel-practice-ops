import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import type { Requirement, Document } from './licenses.js';

export const CHK_GROUPS = ['Entity', 'Banking', 'Insurance', 'Identifiers', 'HIPAA', 'General'] as const;
export type ChecklistGroup = typeof CHK_GROUPS[number];

export const checklistTasks = pgTable('checklist_tasks', {
  id:           uuid('id').defaultRandom().primaryKey(),
  tenantId:     text('tenant_id').notNull(),
  task:         text('task').notNull(),
  group:        text('group', { enum: CHK_GROUPS }).notNull().default('General'),
  status:       text('status', { enum: ['notstarted', 'progress', 'done'] }).notNull().default('notstarted'),
  date:         text('date'),
  owner:        text('owner'),
  notes:        text('notes'),
  requirements: jsonb('requirements').$type<Requirement[]>().notNull().default([]),
  documents:    jsonb('documents').$type<Document[]>().notNull().default([]),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ChecklistTask = typeof checklistTasks.$inferSelect;
export type NewChecklistTask = typeof checklistTasks.$inferInsert;
