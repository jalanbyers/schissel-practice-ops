"""Structural guarantees that must hold regardless of what the model says.

Everything here is enforced in Python, not in the instruction. A prompt can be
argued with; these cannot. Each test corresponds to a boundary in
docs/DESIGN_SPEC.md that the eval alone would not prove.
"""

import pytest

from app.agent import (
    _condition_1,
    _condition_2,
    _condition_3,
    _record,
    assign_status,
    lookup_state_requirement,
)

CARE_DATE = "2026-10-01"


def _verbatim_ohio_span() -> str:
    req = _record("OH")["requirement_summary"]
    start = req.index("physicians holding")
    end = req.index("prior to the first patient encounter.") + len(
        "prior to the first patient encounter."
    )
    return req[start:end]


# --- the label is not reachable (DESIGN_SPEC §5a) ---------------------------


def test_lookup_strips_operator_notes():
    """The agent must catch ambiguity from the requirement text. If the label
    were reachable, R-AMBIG-01 could be passed by a lookup."""
    for state in ("OH", "CA", "AZ"):
        assert "operator_notes" not in lookup_state_requirement(state)


def test_operator_notes_exists_in_the_fixture():
    """Guards the test above: if the field were simply gone from the data, the
    strip would be vacuous and the guarantee meaningless."""
    assert _record("OH")["operator_notes"]


# --- the synthetic-data boundary (DESIGN_SPEC §2) ---------------------------


def test_non_synthetic_record_is_refused(monkeypatch):
    import app.agent as agent

    real = agent._record

    def fake(state):
        r = dict(real(state))
        r["record_id"] = "PROD-REQ-OH"
        return r

    monkeypatch.setattr(agent, "_record", fake)
    with pytest.raises(ValueError, match="non-synthetic"):
        agent.lookup_state_requirement("OH")


# --- condition 4 must be evidenced ------------------------------------------


def test_paraphrased_span_is_rejected():
    result = assign_status(
        "OH", CARE_DATE, "human_review_required",
        "fail", "internal_contradiction", "Ohio's rules contradict each other", "r",
    )
    assert result["status"] == "error"
    assert "verbatim" in result["error"]


def test_missing_span_is_rejected():
    result = assign_status(
        "OH", CARE_DATE, "human_review_required", "fail", "internal_contradiction", "", "r"
    )
    assert result["status"] == "error"
    assert "required" in result["error"]


def test_invalid_failure_mode_is_rejected():
    result = assign_status(
        "OH", CARE_DATE, "human_review_required",
        "fail", "seems_off", _verbatim_ohio_span(), "r",
    )
    assert result["status"] == "error"


def test_verbatim_span_is_accepted():
    result = assign_status(
        "OH", CARE_DATE, "human_review_required",
        "fail", "internal_contradiction", _verbatim_ohio_span(), "r",
    )
    assert result["status"] == "ok"


# --- the gate (DESIGN_SPEC §5d) ---------------------------------------------


def test_failing_condition_forces_escalation_over_proposed_status():
    """The model proposing a clean status does not make it so."""
    result = assign_status(
        "OH", CARE_DATE, "new_application_needed",
        "fail", "internal_contradiction", _verbatim_ohio_span(), "r",
    )
    assert result["result"]["status"] == "human_review_required"


def test_stale_record_escalates_even_when_condition_4_passes():
    """AZ is fresh-failing only. The model cannot rescue it by judging the
    language clear."""
    result = assign_status("AZ", CARE_DATE, "license_current", "pass", "none", "", "clear")
    assert result["result"]["status"] == "human_review_required"
    assert "condition 1" in result["result"]["escalation_reason"]


def test_conditions_1_to_3_are_recomputed_not_taken_on_trust():
    """There is no argument by which the model can report conditions 1-3."""
    import inspect

    params = inspect.signature(assign_status).parameters
    for n in (1, 2, 3):
        assert not any(f"condition_{n}" in p for p in params), (
            f"condition {n} must not be a model-supplied argument"
        )


# --- no over-escalation (DESIGN_SPEC §10 passing criteria) ------------------


@pytest.mark.parametrize("state,expected", [
    ("CA", "license_current"),
    ("NC", "new_application_needed"),
    ("TX", "application_in_progress"),
])
def test_clean_states_are_not_escalated(state, expected):
    result = assign_status(state, CARE_DATE, expected, "pass", "none", "", "clear")
    assert result["result"]["status"] == expected


def test_north_carolina_dot_org_board_is_authoritative():
    """NC's board is ncmedboard.org. A .gov-only rule would fail condition 2
    and escalate a clear record."""
    assert _condition_2(_record("NC"))["verdict"] == "pass"


def test_ohio_passes_conditions_1_to_3():
    """R-AMBIG-01 is only meaningful if Ohio is clean on every deterministic
    axis. If this breaks, the case stops testing judgment."""
    oh = _record("OH")
    assert _condition_1(oh, CARE_DATE)["verdict"] == "pass"
    assert _condition_2(oh)["verdict"] == "pass"
    assert _condition_3(oh)["verdict"] == "pass"


# --- approval gate (DESIGN_SPEC §8) -----------------------------------------


def test_every_result_is_pending_physician_review():
    for state in ("CA", "OH", "AZ"):
        result = assign_status(state, CARE_DATE, "license_current", "pass", "none", "", "c")
        assert result["result"]["approval_status"] == "pending_physician_review"


def test_agent_has_no_publish_tool():
    """The approval gate is a capability the agent lacks, not a rule it
    follows. This asserts the exact tool surface, so adding any tool has to be
    a deliberate act that updates this list."""
    from app.agent import root_agent

    names = {getattr(t, "__name__", getattr(t, "name", "")) for t in root_agent.tools}
    assert names == {
        "normalize_contract_states",
        "lookup_state_requirement",
        "assign_status",
    }


def test_no_tool_can_publish_submit_or_contact():
    """Independent of the exact list: nothing on the agent may perform an
    outward action."""
    from app.agent import root_agent

    forbidden = ("publish", "submit", "post", "send", "contact", "approve", "email")
    for tool in root_agent.tools:
        name = getattr(tool, "__name__", getattr(tool, "name", "")).lower()
        assert not any(f in name for f in forbidden), f"outward-action tool exposed: {name}"
