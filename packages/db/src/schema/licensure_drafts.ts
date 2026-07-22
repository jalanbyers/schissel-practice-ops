import { pgTable, text, timestamp, uuid, jsonb, index } from 'drizzle-orm/pg-core';

/**
 * Licensure analyst drafts — the pending-review store.
 *
 * DESIGN_SPEC §8 describes an approval gate: the agent produces drafts, a
 * physician approves, and only approved results reach the dashboard. The
 * agent half was already real (it has no tool that can publish, and stamps
 * every result `pending_physician_review`). This table is the other half —
 * without it the gate guarded a door that led nowhere.
 *
 * `payload` holds the agent's result object verbatim, including the clarity
 * checks and the quoted span. Storing it whole rather than shredding it into
 * columns is deliberate: the physician is reviewing what the agent actually
 * said, and a lossy projection would undermine that.
 */
export const licensureDrafts = pgTable(
  'licensure_drafts',
  {
    id:         uuid('id').defaultRandom().primaryKey(),
    tenantId:   text('tenant_id').notNull(),
    contractId: text('contract_id').notNull(),
    /** Two-letter state code the draft is about. */
    state:      text('state').notNull(),
    /** ISO date of planned first patient care, as analyzed. */
    plannedCareDate: text('planned_care_date'),
    /** The agent's result object, stored whole. */
    payload:    jsonb('payload').$type<Record<string, unknown>>().notNull(),
    /**
     * Never defaults to approved. A row arrives pending and only a physician
     * action moves it — see DESIGN_SPEC §8.
     */
    approvalStatus: text('approval_status', {
      enum: ['pending', 'approved', 'rejected', 'escalated'],
    }).notNull().default('pending'),
    /** Physician's note when editing, rejecting, or escalating. */
    reviewNote: text('review_note'),
    reviewedBy: text('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt:  timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byTenantContract: index('licensure_drafts_tenant_contract_idx').on(t.tenantId, t.contractId),
  }),
);

export type LicensureDraft = typeof licensureDrafts.$inferSelect;
export type NewLicensureDraft = typeof licensureDrafts.$inferInsert;
