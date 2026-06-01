-- Initial schema migration.
-- Every table carries tenant_id NOT NULL — the application layer
-- is the authoritative isolation gate (see src/__tests__/tenant-isolation.test.ts).
-- Run via: pnpm --filter @schissel/db migrate
-- Or directly: psql $DATABASE_URL -f migrations/0000_initial.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Licenses ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS licenses (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     TEXT          NOT NULL,
  code          TEXT          NOT NULL,
  name          TEXT          NOT NULL,
  status        TEXT          NOT NULL DEFAULT 'none',
  imlc          BOOLEAN       NOT NULL DEFAULT false,
  home          BOOLEAN       NOT NULL DEFAULT false,
  license_no    TEXT,
  issued        TEXT,
  expires       TEXT,
  cycle         TEXT,
  fee           TEXT,
  board         TEXT,
  board_url     TEXT,
  notes         TEXT,
  requirements  JSONB         NOT NULL DEFAULT '[]',
  documents     JSONB         NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS licenses_tenant_id ON licenses (tenant_id);
CREATE INDEX IF NOT EXISTS licenses_tenant_code ON licenses (tenant_id, code);

-- ── Payers ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payers (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       TEXT          NOT NULL,
  name            TEXT          NOT NULL,
  type            TEXT          NOT NULL DEFAULT 'Commercial',
  status          TEXT          NOT NULL DEFAULT 'notstarted',
  date            TEXT,
  effective_date  TEXT,
  revalidation    TEXT,
  provider_id     TEXT,
  rep             TEXT,
  portal_url      TEXT,
  notes           TEXT,
  requirements    JSONB         NOT NULL DEFAULT '[]',
  documents       JSONB         NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payers_tenant_id ON payers (tenant_id);

-- ── Engagements ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS engagements (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     TEXT          NOT NULL,
  name          TEXT          NOT NULL,
  model         TEXT          NOT NULL DEFAULT 'Other',
  volume        TEXT,
  rate          TEXT,
  status        TEXT          NOT NULL DEFAULT 'prospect',
  start_date    TEXT,
  contact       TEXT,
  portal_url    TEXT,
  pay_terms     TEXT,
  notes         TEXT,
  requirements  JSONB         NOT NULL DEFAULT '[]',
  documents     JSONB         NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS engagements_tenant_id ON engagements (tenant_id);

-- ── Checklist tasks ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checklist_tasks (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     TEXT          NOT NULL,
  task          TEXT          NOT NULL,
  "group"       TEXT          NOT NULL DEFAULT 'General',
  status        TEXT          NOT NULL DEFAULT 'notstarted',
  date          TEXT,
  owner         TEXT,
  notes         TEXT,
  requirements  JSONB         NOT NULL DEFAULT '[]',
  documents     JSONB         NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS checklist_tasks_tenant_id ON checklist_tasks (tenant_id);

-- ── Ledger entries ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ledger_entries (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   TEXT           NOT NULL,
  date        TEXT           NOT NULL,
  type        TEXT           NOT NULL,
  category    TEXT           NOT NULL,
  source      TEXT           NOT NULL,
  amount      NUMERIC(12,2)  NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ledger_entries_tenant_id ON ledger_entries (tenant_id);
CREATE INDEX IF NOT EXISTS ledger_entries_tenant_date ON ledger_entries (tenant_id, date DESC);

-- ── Tax payments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tax_payments (
  id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    TEXT           NOT NULL,
  label        TEXT           NOT NULL,
  due          TEXT           NOT NULL,
  paid         BOOLEAN        NOT NULL DEFAULT false,
  paid_amount  NUMERIC(12,2),
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tax_payments_tenant_id ON tax_payments (tenant_id);

-- ── Settings (one row per tenant) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  tenant_id     TEXT           PRIMARY KEY,
  name          TEXT           NOT NULL DEFAULT '',
  entity        TEXT           NOT NULL DEFAULT '',
  home_state    TEXT           NOT NULL DEFAULT '',
  npi           TEXT,
  ein           TEXT,
  email         TEXT,
  phone         TEXT,
  timezone      TEXT           NOT NULL DEFAULT 'America/New_York',
  tax_rate      NUMERIC(5,4)   NOT NULL DEFAULT 0.27,
  notifications JSONB          NOT NULL DEFAULT '{"licenseRenewals":true,"recredentialing":true,"complianceDue":true,"weeklyDigest":false,"leadDays":30}',
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- ── Audit log (append-only) ───────────────────────────────────────────────────
-- Step 9 audit events written here in production.
-- The application layer emits to this table via emitAudit(); never deletes rows.
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   TEXT          NOT NULL,
  ts          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  action      TEXT          NOT NULL,  -- create | update | delete | toggle
  entity      TEXT          NOT NULL,  -- license | payer | engagement | ledger | task
  entity_id   TEXT          NOT NULL,
  label       TEXT          NOT NULL,
  user_id     TEXT,                    -- Auth0 sub from JWT
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_tenant_ts ON audit_log (tenant_id, ts DESC);
