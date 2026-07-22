"""Makes app/data/output_examples.json executable rather than decorative.

Faculty credited this artifact for showing the model what wrong looks like.
A file of bad examples is only worth having if the badness is actually caught,
so every rejected example declares the mechanism that catches it — a tool, the
gate, or an eval metric — and this suite proves the claim.

The value is in the failure direction: if someone removes the verbatim-span
check, or the status derivation, or a deny-list entry, the corresponding
example stops being caught and this fails. The file becomes an inventory of
guarantees that cannot silently rot.
"""

import importlib.util
import json
from pathlib import Path

import pytest

from app.agent import _record, assign_status

_DATA = Path(__file__).resolve().parents[1].parent / "app" / "data" / "output_examples.json"
_METRIC = Path(__file__).resolve().parents[1] / "eval" / "prd_cases.py"
_spec = importlib.util.spec_from_file_location("prd_cases", _METRIC)
prd = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(prd)

EXAMPLES = json.loads(_DATA.read_text())
REJECTED = {e["id"]: e for e in EXAMPLES["rejected"]}
ACCEPTED = {e["id"]: e for e in EXAMPLES["accepted"]}
CARE_DATE = "2026-10-01"


def _as_text(output) -> str:
    return output if isinstance(output, str) else json.dumps(output)


def _safety_hits(output) -> list[str]:
    text = _as_text(output)
    return (
        prd._banned(text, prd.AUTHORIZATION_DENY)
        + prd._banned(text, prd.ACTION_CLAIM_DENY)
        + prd._banned(text, prd.LEGAL_ADVICE_DENY)
    )


# --- the file itself --------------------------------------------------------


def test_every_rejected_example_declares_a_catcher():
    valid = set(EXAMPLES["caught_by_legend"])
    for eid, ex in REJECTED.items():
        assert ex["caught_by"] in valid, f"{eid}: unknown caught_by {ex['caught_by']!r}"


def test_no_guarantee_is_silently_unenforced():
    """`unenforced` is allowed in the schema so gaps can be recorded honestly.
    This asserts none are currently in that state — if one is added, that is a
    deliberate act, not an oversight."""
    unenforced = [i for i, e in REJECTED.items() if e["caught_by"] == "unenforced"]
    assert unenforced == [], f"unenforced violations present: {unenforced}"


# --- metric-caught examples -------------------------------------------------


@pytest.mark.parametrize("eid", [
    "rej-authorization-claim",
    "rej-legal-advice",
    "rej-claimed-submission",
])
def test_deny_list_violations_are_detected(eid):
    assert _safety_hits(REJECTED[eid]["output"]), f"{eid} was not caught"


def test_failure_to_escalate_is_caught_by_the_ambiguity_metric():
    spec = importlib.util.spec_from_file_location(
        "r_ambig_01", Path(__file__).resolve().parents[1] / "eval" / "r_ambig_01.py"
    )
    rambig = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rambig)

    payload = REJECTED["rej-failure-to-escalate"]["output"]
    result = rambig.evaluate(
        {"response": {"role": "model", "parts": [{"text": json.dumps(payload)}]}}
    )
    assert result["score"] == 0.0


def test_over_escalation_is_caught():
    payload = REJECTED["rej-over-escalation"]["output"]
    result = prd.evaluate({
        "eval_case_id": "case_1_current_license_happy_path",
        "response": {"role": "model", "parts": [{"text": json.dumps(payload)}]},
    })
    assert result["score"] == 0.0


def test_missing_citation_is_caught():
    payload = REJECTED["rej-missing-citation"]["output"]
    result = prd.evaluate({
        "eval_case_id": "case_1_current_license_happy_path",
        "response": {"role": "model", "parts": [{"text": json.dumps(payload)}]},
    })
    assert result["score"] == 0.0


def test_approval_bypass_is_caught():
    payload = REJECTED["rej-approval-bypass"]["output"]
    result = prd.evaluate({
        "eval_case_id": "case_1_current_license_happy_path",
        "response": {"role": "model", "parts": [{"text": json.dumps(payload)}]},
    })
    assert result["score"] == 0.0


# --- tool- and gate-caught examples: structurally impossible ----------------


def test_paraphrased_span_is_refused_by_the_tool():
    """rej-right-answer-wrong-reason never becomes a result at all."""
    span = REJECTED["rej-right-answer-wrong-reason"]["output"]["clarity_checks"][0]["quoted_span"]
    result = assign_status(
        "OH", CARE_DATE, "human_review_required", "fail", "internal_contradiction", span, "r"
    )
    assert result["status"] == "error"
    assert "verbatim" in result["error"]


def test_status_misstatement_is_refused_by_derivation():
    """rej-status-misstatement cannot be produced: the status comes from the
    record, not from the model's proposal."""
    result = assign_status("FL", CARE_DATE, "license_current", "pass", "none", "", "clear")
    assert result["result"]["status"] == "renewal_needed"
    assert result["result"]["model_proposed_status"] == "license_current"


def test_gate_order_violation_is_impossible():
    """rej-gate-order-violation: AZ fails condition 1, so no actionable status
    can be assigned regardless of what was proposed."""
    result = assign_status("AZ", CARE_DATE, "license_current", "pass", "none", "", "clear")
    assert result["result"]["status"] == "human_review_required"


# --- accepted examples must NOT trip anything -------------------------------


@pytest.mark.parametrize("eid", sorted(ACCEPTED))
def test_accepted_examples_are_clean(eid):
    """The refusal example (acc-3) repeats forbidden phrases in order to
    decline them. A scoring rule that cannot tell refusal from assertion would
    fail it — which would make the boundary cases unpassable."""
    assert _safety_hits(ACCEPTED[eid]["output"]) == [], eid


def test_accepted_ohio_span_is_verbatim():
    """acc-2 quotes the real record. If the fixture is edited without updating
    the example, this catches the drift."""
    span = ACCEPTED["acc-2"]["output"]["clarity_checks"][0]["quoted_span"]
    assert span in _record("OH")["requirement_summary"]
