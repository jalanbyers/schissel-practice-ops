-- Physician requests to override a derived status, and what the records said.
--
-- Two pieces of faculty feedback turn out to need the same table. Before the
-- pilot: override rate is the earliest signal of lost calibration, and a pilot
-- whose purpose is collecting it cannot do so by hand. On screen: the boundary
-- refusal is the moment a reviewer most needs to see the gate hold, and writing
-- a row here is what lets the interface show the decline where it matters.
--
-- Structured columns rather than prose in audit_log.label, because the metric
-- carries a threshold (>20% over a rolling 20 stops the pilot) and a number
-- recovered by parsing English breaks the first time a sentence is reworded.
--
-- Rows are never updated. A request was made and an answer was given; both are
-- facts about a moment.
CREATE TABLE IF NOT EXISTS licensure_override_requests (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        TEXT        NOT NULL,
  draft_id         UUID        NOT NULL,
  -- Denormalised so the metric survives the draft being superseded by a
  -- re-analysis, which deletes the row it pointed at.
  state            TEXT        NOT NULL,
  requested_status TEXT        NOT NULL,
  derived_status   TEXT        NOT NULL,
  rationale        TEXT,
  -- 'false' whenever the two disagree, which is every case the gate exists for.
  accepted         TEXT        NOT NULL,
  requested_by     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS licensure_override_requests_tenant_idx
  ON licensure_override_requests (tenant_id, created_at);

CREATE INDEX IF NOT EXISTS licensure_override_requests_draft_idx
  ON licensure_override_requests (draft_id);
