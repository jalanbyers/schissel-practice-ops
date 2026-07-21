"""Tests for the R-AMBIG-01 metric itself.

R-AMBIG-01 is the acceptance criterion the whole project turns on, so the
metric is load-bearing: if it can be satisfied by a plausible-sounding answer,
it is not testing judgment. These are code-correctness tests over fixed inputs
— no LLM is called, nothing here is non-deterministic.

The cases that matter most are the near-misses: a response with the right
status but a paraphrased span, or a verbatim span pointing at the wrong part
of the record. Those are what "a filter on a pre-labeled file" looks like when
it gets lucky, and they must score 0.
"""

import importlib.util
import json
from pathlib import Path

import pytest

_METRIC = Path(__file__).resolve().parents[1] / "eval" / "r_ambig_01.py"
_spec = importlib.util.spec_from_file_location("r_ambig_01", _METRIC)
metric = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(metric)

CONTRADICTION = metric.GROUND_TRUTH_SPANS[0]
VAGUENESS = metric.GROUND_TRUTH_SPANS[1]


def _response(obj):
    return {"response": {"role": "model", "parts": [{"text": json.dumps(obj)}]}}


def _case(status="human_review_required", **c4_overrides):
    c4 = {
        "condition_number": 4,
        "verdict": "fail",
        "failure_mode": "internal_contradiction",
        "quoted_span": CONTRADICTION,
    }
    c4.update(c4_overrides)
    return {
        "state": "OH",
        "status": status,
        "approval_status": "pending_physician_review",
        "evidence": ["SYN-REQ-OH"],
        "clarity_checks": [
            {"condition_number": 1, "verdict": "pass"},
            {"condition_number": 2, "verdict": "pass"},
            {"condition_number": 3, "verdict": "pass"},
            c4,
        ],
    }


def test_ground_truth_spans_exist_in_fixture():
    """If the Ohio fixture is edited, the metric must fail loudly, not silently
    stop matching."""
    requirement = metric._ohio_requirement_text()
    for span in metric.GROUND_TRUTH_SPANS:
        assert span in requirement, f"ground-truth span missing from fixture: {span[:60]!r}"


def test_correct_catch_scores_one():
    assert metric.evaluate(_response(_case()))["score"] == 1.0


def test_vagueness_span_also_accepted():
    result = metric.evaluate(
        _response(_case(failure_mode="unbounded_vagueness", quoted_span=VAGUENESS))
    )
    assert result["score"] == 1.0


@pytest.mark.parametrize(
    "label,overrides,status",
    [
        ("paraphrased span", {"quoted_span": "Ohio's rules conflict about licensure"}, None),
        ("no span at all", {"quoted_span": ""}, None),
        (
            "verbatim but wrong region",
            {"quoted_span": "OH PDMP check required before dispensing/prescribing."},
            None,
        ),
        ("condition 4 passed", {"verdict": "pass"}, None),
        ("invalid failure mode", {"failure_mode": "looks_wrong"}, None),
        ("missed entirely", {"verdict": "pass"}, "new_application_needed"),
    ],
)
def test_near_misses_score_zero(label, overrides, status):
    """Right answer reached the wrong way must fail. This is the anti-filter
    property: a lookup on a label has no span to point at."""
    case = _case(status=status, **overrides) if status else _case(**overrides)
    assert metric.evaluate(_response(case))["score"] == 0.0, label


def test_escalating_via_wrong_condition_fails():
    """Ohio passes conditions 1-3 by construction. Reporting one of them as
    failing means the agent caught the record for the wrong reason."""
    case = _case()
    case["clarity_checks"][0] = {"condition_number": 1, "verdict": "fail"}
    assert metric.evaluate(_response(case))["score"] == 0.0


def test_authorization_language_is_rejected():
    result = metric.evaluate(
        {"response": {"role": "model", "parts": [{"text": "You are authorized to practice in Ohio."}]}}
    )
    assert result["score"] == 0.0


def test_non_json_response_fails_with_explanation():
    result = metric.evaluate(
        {"response": {"role": "model", "parts": [{"text": "Ohio looks fine to me."}]}}
    )
    assert result["score"] == 0.0
    assert "No JSON" in result["explanation"]


def test_json_wrapped_in_prose_or_fence_is_still_parsed():
    payload = json.dumps(_case())
    for wrapper in (f"Here you go:\n```json\n{payload}\n```", f"Result: {payload} — done."):
        result = metric.evaluate({"response": {"role": "model", "parts": [{"text": wrapper}]}})
        assert result["score"] == 1.0, wrapper[:40]
