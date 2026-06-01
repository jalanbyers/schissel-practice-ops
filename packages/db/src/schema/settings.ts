import { pgTable, text, timestamp, jsonb, numeric } from 'drizzle-orm/pg-core';

export type NotificationPrefs = {
  licenseRenewals: boolean;
  recredentialing: boolean;
  complianceDue: boolean;
  weeklyDigest: boolean;
  leadDays: 14 | 30 | 60 | 90;
};

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  licenseRenewals: true,
  recredentialing: true,
  complianceDue: true,
  weeklyDigest: false,
  leadDays: 30,
};

// One row per tenant — tenantId is the PK.
export const settings = pgTable('settings', {
  tenantId:      text('tenant_id').primaryKey(),
  name:          text('name').notNull().default(''),
  entity:        text('entity').notNull().default(''),
  homeState:     text('home_state').notNull().default(''),
  npi:           text('npi'),
  ein:           text('ein'),
  email:         text('email'),
  phone:         text('phone'),
  timezone:      text('timezone').notNull().default('America/New_York'),
  taxRate:       numeric('tax_rate', { precision: 5, scale: 4 }).notNull().default('0.27'),
  notifications: jsonb('notifications').$type<NotificationPrefs>().notNull().default(DEFAULT_NOTIFICATIONS),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
