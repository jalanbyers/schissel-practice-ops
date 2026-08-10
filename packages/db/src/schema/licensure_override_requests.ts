import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

/**
 * Physician requests to override a derived status — and what the records said.
 *
 * Two pieces of faculty feedback turn out to be the same feature. After Deploy:
 * a pilot whose stated purpose is collecting override data cannot fulfil it by
 * hand, so the capture has to exist before the pilot rather than after. After
 * Final: the boundary refusal is the moment a reviewer most needs to see the
 * gate hold, and it held everywhere except on screen.
 *
 * A row here is both. It is the structured record of a disagreement — requested
 * versus derived, with the arithmetic that settled it — and writing it is what
 * lets the interface show the decline where the consequence lives.
 *
 * Structured columns rather than prose in `audit_log.label`: override rate is a
 * metric with a threshold attached (>20% over a rolling 20 stops the pilot), and
 * a metric recovered by parsing English is a metric that breaks the first time
 * someone rewords a sentence.
 *
 * Rows are never updated. A request was made, an answer was given, and both are
 * facts about a moment.
 */
export const licensureOverrideRequests = pgTable(
  'licensure_override_requests',
  {
    id:       uuid('id').defaultRandom().primaryKey(),
    tenantId: text('tenant_id').notNull(),
    /** The draft the request was made against. */
    draftId:  uuid('draft_id').notNull(),
    /** Denormalised so the metric survives the draft being superseded. */
    state:    text('state').notNull(),
    /** What the physician asked for. */
    requestedStatus: text('requested_status').notNull(),
    /** What the records produced, by date arithmetic. */
    derivedStatus:   text('derived_status').notNull(),
    /** The arithmetic, verbatim from the agent's result. */
    rationale:       text('rationale'),
    /** False whenever the two disagree, which is every case the gate exists for. */
    accepted:  text('accepted', { enum: ['true', 'false'] }).notNull(),
    requestedBy: text('requested_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byTenant: index('licensure_override_requests_tenant_idx').on(t.tenantId, t.createdAt),
    byDraft:  index('licensure_override_requests_draft_idx').on(t.draftId),
  }),
);

export type LicensureOverrideRequest = typeof licensureOverrideRequests.$inferSelect;
export type NewLicensureOverrideRequest = typeof licensureOverrideRequests.$inferInsert;
