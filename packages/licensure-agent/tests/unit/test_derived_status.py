"""Status derivation and contract-input normalization.

Eval case 4 asks whether the agent refuses to misstate a status under user
pressure. Before this, `assign_status` accepted whatever the model proposed as
long as the clarity conditions passed — so "just mark it current" would have
worked on Florida, whose licence expires before the planned care date.

Comparing an expiry date to a care date is arithmetic, so the status is now
computed from the records and the model's proposal is recorded rather than
honoured. These tests prove that without calling the model, which matters
because they hold on every run rather than probabilistically.
"""

import pytest

from app.agent import (
    _derive_status,
    _record,
    assign_status,
    normalize_contract_states,
)

CARE_DATE = "2026-10-01"


@pytest.mark.parametrize("state,expected", [
    ("CA", "license_current"),           # expires 2026-12-31, after care date
    ("FL", "renewal_needed"),            # expires 2026-07-20, BEFORE care date
    ("TX", "application_in_progress"),   # application on record
    ("NC", "new_application_needed"),    # nothing on record
])
def test_status_is_derived_from_records(state, expected):
    status, _, _ = _derive_status(_record(state), CARE_DATE)
    assert status == expected


def test_expiry_before_care_date_is_urgent():
    status, rationale, urgency = _derive_status(_record("FL"), CARE_DATE)
    assert status == "renewal_needed"
    assert urgency == "urgent"
    assert "BEFORE" in rationale


def test_unparseable_expiry_escalates_rather_than_guessing():
    record = dict(_record("CA"))
    record["license_date"] = "sometime next year"
    status, rationale, urgency = _derive_status(record, CARE_DATE)
    assert status == "human_review_required"
    assert urgency == "urgent"
    assert "not a valid date" in rationale


# --- eval case 4: the difficult user ---------------------------------------


def test_pressure_cannot_change_a_status():
    """'Just mark it current' has no code path that honours it."""
    result = assign_status("FL", CARE_DATE, "license_current", "pass", "none", "", "clear")["result"]
    assert result["status"] == "renewal_needed"
    assert result["urgency"] == "urgent"


def test_disagreement_is_recorded_for_audit():
    """Overriding silently would hide that the model tried to comply."""
    result = assign_status("FL", CARE_DATE, "license_current", "pass", "none", "", "clear")["result"]
    assert result["model_proposed_status"] == "license_current"
    assert result["proposal_overridden"] is True
    assert "not accepted" in result["override_note"]


def test_agreeing_proposal_records_no_override():
    result = assign_status("FL", CARE_DATE, "renewal_needed", "pass", "none", "", "clear")["result"]
    assert "model_proposed_status" not in result
    assert result["status"] == "renewal_needed"


def test_status_source_is_labelled():
    result = assign_status("CA", CARE_DATE, "license_current", "pass", "none", "", "clear")["result"]
    assert result["status_source"] == "derived_from_records"
    assert result["status_rationale"]


def test_urgent_timing_recommends_an_expert():
    result = assign_status("FL", CARE_DATE, "renewal_needed", "pass", "none", "", "clear")["result"]
    assert "licensing" in result["recommended_expert"].lower()


# --- eval case 2: duplicate contract input ---------------------------------


def test_full_name_and_code_collapse_to_one_state():
    out = normalize_contract_states(["North Carolina", "NC"])
    assert out["states"] == ["NC"]
    assert out["count"] == 1
    assert out["duplicates_removed"]


def test_mixed_contract_list_is_canonicalized_in_order():
    out = normalize_contract_states(["California", "FL", "Florida", "Ohio"])
    assert out["states"] == ["CA", "FL", "OH"]


def test_unrecognized_states_are_reported_not_dropped_silently():
    out = normalize_contract_states(["California", "Atlantis"])
    assert out["states"] == ["CA"]
    assert out["unrecognized"] == ["Atlantis"]


def test_empty_and_blank_entries_are_ignored():
    out = normalize_contract_states(["", "  ", "CA"])
    assert out["states"] == ["CA"]


# --- the gate still wins over derivation ------------------------------------


def test_failing_clarity_condition_beats_a_clean_derived_status():
    """AZ derives license_current, but its record is stale. Escalation wins."""
    derived, _, _ = _derive_status(_record("AZ"), CARE_DATE)
    assert derived == "license_current"

    result = assign_status("AZ", CARE_DATE, "license_current", "pass", "none", "", "clear")["result"]
    assert result["status"] == "human_review_required"
    assert "condition 1" in result["escalation_reason"]
