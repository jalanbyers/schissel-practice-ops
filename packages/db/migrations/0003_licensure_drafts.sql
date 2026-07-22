-- Pending-review store for licensure analyst drafts (DESIGN_SPEC §8).
-- Rows arrive pending; only a physician action moves them out of that state.
CREATE TABLE IF NOT EXISTS licensure_drafts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         TEXT        NOT NULL,
  contract_id       TEXT        NOT NULL,
  state             TEXT        NOT NULL,
  planned_care_date TEXT,
  payload           JSONB       NOT NULL,
  approval_status   TEXT        NOT NULL DEFAULT 'pending',
  review_note       TEXT,
  reviewed_by       TEXT,
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS licensure_drafts_tenant_contract_idx
  ON licensure_drafts (tenant_id, contract_id);
