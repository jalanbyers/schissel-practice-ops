import { sql } from 'drizzle-orm';
import type { DrizzleDb } from '../../client.js';

/**
 * Creates all tables in the test database. Mirrors the Drizzle schema exactly.
 * Used instead of drizzle-kit migrate so tests have no dependency on generated
 * migration files — the schema is the source of truth.
 */
export async function setupSchema(db: DrizzleDb): Promise<void> {
  // pgcrypto is only needed on Postgres < 13. PG13+ and PGlite ship
  // gen_random_uuid() as a built-in, so this is a no-op but kept for
  // environments that still need it.
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  } catch {
    // Not available in PGlite — gen_random_uuid() is built-in; continue.
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS licenses (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id    TEXT        NOT NULL,
      code         TEXT        NOT NULL,
      name         TEXT        NOT NULL,
      status       TEXT        NOT NULL DEFAULT 'none',
      imlc         BOOLEAN     NOT NULL DEFAULT false,
      home         BOOLEAN     NOT NULL DEFAULT false,
      license_no   TEXT,
      issued       TEXT,
      expires      TEXT,
      cycle        TEXT,
      fee          TEXT,
      board        TEXT,
      board_url    TEXT,
      notes        TEXT,
      requirements JSONB       NOT NULL DEFAULT '[]',
      documents    JSONB       NOT NULL DEFAULT '[]',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS payers (
      id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id      TEXT        NOT NULL,
      name           TEXT        NOT NULL,
      type           TEXT        NOT NULL DEFAULT 'Commercial',
      status         TEXT        NOT NULL DEFAULT 'notstarted',
      date           TEXT,
      effective_date TEXT,
      revalidation   TEXT,
      provider_id    TEXT,
      rep            TEXT,
      portal_url     TEXT,
      notes          TEXT,
      requirements   JSONB       NOT NULL DEFAULT '[]',
      documents      JSONB       NOT NULL DEFAULT '[]',
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS engagements (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id    TEXT        NOT NULL,
      name         TEXT        NOT NULL,
      model        TEXT        NOT NULL DEFAULT 'Other',
      volume       TEXT,
      rate         TEXT,
      status       TEXT        NOT NULL DEFAULT 'prospect',
      start_date   TEXT,
      contact      TEXT,
      portal_url   TEXT,
      pay_terms    TEXT,
      notes        TEXT,
      requirements JSONB       NOT NULL DEFAULT '[]',
      documents    JSONB       NOT NULL DEFAULT '[]',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS checklist_tasks (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id    TEXT        NOT NULL,
      task         TEXT        NOT NULL,
      "group"      TEXT        NOT NULL DEFAULT 'General',
      status       TEXT        NOT NULL DEFAULT 'notstarted',
      date         TEXT,
      owner        TEXT,
      notes        TEXT,
      requirements JSONB       NOT NULL DEFAULT '[]',
      documents    JSONB       NOT NULL DEFAULT '[]',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ledger_entries (
      id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id  TEXT         NOT NULL,
      date       TEXT         NOT NULL,
      type       TEXT         NOT NULL,
      category   TEXT         NOT NULL,
      source     TEXT         NOT NULL,
      amount     NUMERIC(12,2) NOT NULL,
      note       TEXT,
      created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS tax_payments (
      id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id   TEXT          NOT NULL,
      label       TEXT          NOT NULL,
      due         TEXT          NOT NULL,
      paid        BOOLEAN       NOT NULL DEFAULT false,
      paid_amount NUMERIC(12,2),
      created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS settings (
      tenant_id     TEXT        PRIMARY KEY,
      name          TEXT        NOT NULL DEFAULT '',
      entity        TEXT        NOT NULL DEFAULT '',
      home_state    TEXT        NOT NULL DEFAULT '',
      npi           TEXT,
      ein           TEXT,
      email         TEXT,
      phone         TEXT,
      timezone      TEXT        NOT NULL DEFAULT 'America/New_York',
      tax_rate      NUMERIC(5,4) NOT NULL DEFAULT 0.27,
      notifications JSONB       NOT NULL DEFAULT '{"licenseRenewals":true,"recredentialing":true,"complianceDue":true,"weeklyDigest":false,"leadDays":30}',
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS audit_log (
      id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id   TEXT          NOT NULL,
      ts          TIMESTAMPTZ   NOT NULL DEFAULT now(),
      action      TEXT          NOT NULL,
      entity      TEXT          NOT NULL,
      entity_id   TEXT          NOT NULL,
      label       TEXT          NOT NULL,
      user_id     TEXT,
      created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
    )
  `);
}
