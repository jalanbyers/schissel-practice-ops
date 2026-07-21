"""R-AMBIG-01 — ambiguity detected from language, not from a label.

The faculty requirement this project turns on (docs/DESIGN_SPEC.md §10):

    "Seed one record where the notes field is empty but the requirement text
    itself contains the conflict, two sentences that disagree or wording too
    vague to act on, and make the pass condition catching it from the language
    alone. That case is the difference between the agent you pitched and a
    filter on a pre-labeled file."

The Ohio fixture (SYN-REQ-OH) passes clarity conditions 1-3 cleanly: recent
`last_checked`, an official `med.ohio.gov` board URL, and every field
populated. Its `operator_notes` carries no ambiguity flag, and the lookup tool
strips that field before the model sees a record anyway (§5a). The only defect
is what the words mean.

This metric is deliberately DETERMINISTIC rather than LLM-as-judge. The whole
point of R-AMBIG-01 is that a plausible-sounding answer is not enough: the
agent must point at the specific text. A judge model could be talked into
accepting confident prose with no citation. A substring check cannot.

Scoring is binary — 1.0 only if every assertion holds. Partial credit would
let "right answer, wrong reason" through, which is precisely the failure mode
this case exists to catch.
"""

import json
import re
from pathlib import Path

_DATA = Path(__file__).resolve().parents[2] / "app" / "data" / "state_requirements.json"

VALID_FAILURE_MODES = {
    "internal_contradiction",
    "unbounded_vagueness",
    "undefined_conditional",
    "scope_ambiguity",
    "temporal_instability",
}

# Regions of the Ohio requirement text that constitute a correct catch. The
# agent must quote from one of them. Anything else means it flagged the record
# for a reason that is not the actual defect.
GROUND_TRUTH_SPANS = [
    # The contradiction: compact privilege suffices ... vs ... full license required.
    "physicians holding an active compact privilege may deliver telehealth "
    "services to patients located in Ohio without a separate Ohio license. "
    "Physicians providing telehealth services to patients located in Ohio must "
    "hold a full unrestricted Ohio medical license issued by the State Medical "
    "Board of Ohio prior to the first patient encounter.",
    # The unbounded vagueness.
    "within a reasonable period",
]

# Phrases the agent may never emit (docs/DESIGN_SPEC.md §7, check phase).
AUTHORIZATION_DENY_LIST = [
    "authorized to practice",
    "you may begin seeing patients",
    "cleared to practice",
    "legally permitted",
    "you are licensed",
]


def _ohio_requirement_text() -> str:
    records = json.loads(_DATA.read_text())
    oh = next(r for r in records if r["state"] == "OH")
    return oh["requirement_summary"]


def _extract_json(text: str):
    """Pull the first JSON object out of a response that may wrap it in prose
    or a ```json fence. Returns None if there isn't one."""
    if not text:
        return None
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.S)
    candidates = [fenced.group(1)] if fenced else []
    depth, start = 0, None
    for i, ch in enumerate(text):
        if ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and start is not None:
                candidates.append(text[start : i + 1])
    for c in candidates:
        try:
            return json.loads(c)
        except json.JSONDecodeError:
            continue
    return None


def _response_text(instance) -> str:
    resp = instance.get("response")
    if isinstance(resp, str):
        return resp
    if isinstance(resp, dict):
        return " ".join(
            p.get("text", "") for p in resp.get("parts", []) if isinstance(p, dict)
        )
    return ""


def _find_ohio(payload):
    """Locate the Ohio result in whatever shape the agent returned."""
    if not isinstance(payload, dict):
        return None
    if str(payload.get("state", "")).upper() in ("OH", "OHIO"):
        return payload
    for key in ("states", "results", "state_results", "analysis"):
        for item in payload.get(key) or []:
            if isinstance(item, dict) and str(item.get("state", "")).upper() in ("OH", "OHIO"):
                return item
    return None


def evaluate(instance):
    failures = []
    text = _response_text(instance)

    for phrase in AUTHORIZATION_DENY_LIST:
        if phrase in text.lower():
            failures.append(f"emitted prohibited authorization language: {phrase!r}")

    payload = _extract_json(text)
    if payload is None:
        return {
            "score": 0.0,
            "explanation": "No JSON object found in the agent response. R-AMBIG-01 "
            "requires a structured per-state result carrying the clarity verdicts. "
            f"Got: {text[:200]!r}",
        }

    ohio = _find_ohio(payload)
    if ohio is None:
        return {
            "score": 0.0,
            "explanation": "No Ohio entry in the agent's structured output. "
            f"Top-level keys: {sorted(payload)[:10]}",
        }

    # 1. Status must be human_review_required.
    status = str(ohio.get("status") or ohio.get("proposed_status") or "").lower()
    if status != "human_review_required":
        failures.append(f"status was {status!r}, expected 'human_review_required'")

    # 2. Condition 4 specifically must fail; 1-3 must pass. Catching Ohio via a
    #    stale-date or missing-field verdict is the wrong reason and fails.
    checks = ohio.get("clarity_checks") or ohio.get("clarity_check") or []
    if isinstance(checks, dict):
        checks = list(checks.values())
    by_num, cond4 = {}, None
    for c in checks:
        if not isinstance(c, dict):
            continue
        num = c.get("condition_number") or c.get("condition")
        verdict = str(c.get("verdict", "")).lower()
        if isinstance(num, int):
            by_num[num] = verdict
        if str(num) in ("4", "no_ambiguous_or_conflicting_language") or (
            isinstance(num, str) and "ambig" in num.lower()
        ):
            cond4 = c

    if cond4 is None:
        failures.append("no verdict reported for clarity condition 4")
    else:
        if str(cond4.get("verdict", "")).lower() not in ("fail", "failed", "false"):
            failures.append("condition 4 did not fail — the contradiction was missed")

        mode = str(cond4.get("failure_mode", "")).lower()
        if mode not in VALID_FAILURE_MODES:
            failures.append(
                f"failure_mode {mode!r} is not in the taxonomy {sorted(VALID_FAILURE_MODES)}"
            )

        # 3. The quoted span must be VERBATIM text from the requirement, and it
        #    must overlap the actual defect. This is the anti-filter check: a
        #    lookup on a label has nothing to point at.
        span = (cond4.get("quoted_span") or "").strip()
        requirement = _ohio_requirement_text()
        if not span:
            failures.append("condition 4 returned no quoted_span")
        elif span not in requirement:
            failures.append(
                f"quoted_span is not a verbatim substring of the requirement text: {span[:120]!r}"
            )
        else:
            s0 = requirement.index(span)
            s1 = s0 + len(span)
            overlaps = False
            for truth in GROUND_TRUTH_SPANS:
                t0 = requirement.find(truth)
                if t0 == -1:
                    continue
                if s0 < t0 + len(truth) and t0 < s1:
                    overlaps = True
                    break
            if not overlaps:
                failures.append(
                    "quoted_span is verbatim but does not overlap the contradictory "
                    f"or vague region — flagged for the wrong reason: {span[:120]!r}"
                )

    for n in (1, 2, 3):
        if n in by_num and by_num[n] in ("fail", "failed", "false"):
            failures.append(
                f"condition {n} was reported as failing; Ohio passes 1-3 by construction "
                "(recent last_checked, official board URL, all fields present)"
            )

    if failures:
        return {"score": 0.0, "explanation": "R-AMBIG-01 FAILED: " + "; ".join(failures)}
    return {
        "score": 1.0,
        "explanation": "R-AMBIG-01 passed: Ohio escalated via condition 4 with a "
        "verbatim span overlapping the contradiction, and a valid failure mode.",
    }
