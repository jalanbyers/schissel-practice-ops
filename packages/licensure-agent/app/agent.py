# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Licensure analyst agent.

Analyzes a telemedicine contract's required states against a physician's
license records and produces source-grounded status classifications as a draft
pending physician approval.

Design (docs/DESIGN_SPEC.md):

  - Clarity conditions 1-3 are deterministic (date arithmetic, a source
    allowlist, a field-presence check) and are computed in Python. They are
    never taken on the model's word — `assign_status` recomputes them.
  - Clarity condition 4, whether the requirement prose contradicts itself or
    is too vague to act on, is irreducible reading comprehension. It is the
    only place the model exercises discretion, which is what makes it
    measurable (eval case R-AMBIG-01).
  - `lookup_state_requirement` strips `operator_notes` before the model sees a
    record, so escalation cannot be satisfied by reading a label.
  - The agent has no tool that can publish to the dashboard. Every result is
    `pending_physician_review`.
"""

import json
from datetime import date, timedelta
from pathlib import Path

from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai import types

_DATA = Path(__file__).parent / "data" / "state_requirements.json"

FRESHNESS_WINDOW_DAYS = 90

VALID_FAILURE_MODES = (
    "internal_contradiction",
    "unbounded_vagueness",
    "undefined_conditional",
    "scope_ambiguity",
    "temporal_instability",
)

# Real state medical boards do not all live on .gov — North Carolina's is
# ncmedboard.org. A naive .gov-only rule would fail condition 2 for NC and
# escalate a perfectly clear record, which the eval counts as over-escalation.
AUTHORITATIVE_HOSTS = ("ncmedboard.org",)

# Fields that must be populated for a record to be actionable (condition 3).
REQUIRED_FIELDS = (
    "state",
    "board",
    "board_url",
    "last_checked",
    "requirement_summary",
    "required_documents",
)


def _records() -> list[dict]:
    return json.loads(_DATA.read_text())


def _record(state: str) -> dict | None:
    key = (state or "").strip().upper()
    for r in _records():
        if r["state"] == key:
            return r
    return None


def _require_synthetic(record: dict) -> None:
    """Enforce the synthetic-data boundary (DESIGN_SPEC §2).

    This agent runs on Cloud Run, which CLAUDE.md's PHI boundary places
    off-limits for real license data. Anything without the SYN- prefix is a
    hard error, not a warning.
    """
    rid = record.get("record_id", "")
    if not rid.startswith("SYN-"):
        raise ValueError(
            f"refusing to process non-synthetic record {rid!r}: this agent is "
            "restricted to synthetic data (see README)"
        )


def _condition_1(record: dict, planned_care_date: str) -> dict:
    """Checked no more than FRESHNESS_WINDOW_DAYS before the planned care date."""
    checked = record.get("last_checked") or ""
    try:
        care = date.fromisoformat(planned_care_date)
        last = date.fromisoformat(checked)
    except ValueError:
        return {
            "condition_number": 1,
            "verdict": "fail",
            "reasoning": f"last_checked {checked!r} or planned care date "
            f"{planned_care_date!r} is missing or not a valid ISO date; "
            "freshness cannot be established",
        }
    age = (care - last).days
    ok = 0 <= age <= FRESHNESS_WINDOW_DAYS
    return {
        "condition_number": 1,
        "verdict": "pass" if ok else "fail",
        "reasoning": f"requirement last checked {checked}, {age} days before the "
        f"planned care date {planned_care_date} "
        f"({'within' if ok else 'outside'} the {FRESHNESS_WINDOW_DAYS}-day window)",
    }


def _condition_2(record: dict) -> dict:
    """Source is an official state medical-board or state-government source."""
    url = (record.get("board_url") or "").lower()
    host = url.split("//")[-1].split("/")[0]
    ok = (
        host.endswith(".gov")
        or ".state." in host
        or any(host.endswith(h) for h in AUTHORITATIVE_HOSTS)
    )
    return {
        "condition_number": 2,
        "verdict": "pass" if ok else "fail",
        "reasoning": f"source {record.get('board')!r} at {host or '(none)'} "
        f"{'is' if ok else 'is not'} a recognized official board or state source",
    }


def _derive_status(record: dict, planned_care_date: str) -> tuple[str, str, str]:
    """Derive the licensure status from the records. Not a model judgment.

    Comparing an expiry date to a care date is arithmetic, so the model does
    not get a vote. This is what makes eval case 4 structural: when the
    physician asks the agent to "just mark it current", there is no code path
    that honours the request — the status is computed from the record, and the
    model's proposal is recorded separately for audit.

    Returns (status, rationale, urgency).
    """
    status_field = (record.get("license_status") or "").lower()
    date_field = record.get("license_date")

    if status_field == "none":
        return (
            "new_application_needed",
            "no license or in-flight application on record for this state",
            "normal",
        )
    if status_field == "progress":
        return (
            "application_in_progress",
            f"application on record ({date_field or 'submitted'})",
            "normal",
        )

    try:
        care = date.fromisoformat(planned_care_date)
        expires = date.fromisoformat(str(date_field))
    except (TypeError, ValueError):
        return (
            "human_review_required",
            f"license expiration {date_field!r} is missing or not a valid date, "
            "so it cannot be compared to the planned care date",
            "urgent",
        )

    if expires < care:
        return (
            "renewal_needed",
            f"license expires {expires.isoformat()}, which is "
            f"{(care - expires).days} days BEFORE the planned first patient-care "
            f"date {care.isoformat()}",
            "urgent",
        )

    margin = (expires - care).days
    return (
        "license_current",
        f"license valid until {expires.isoformat()}, {margin} days beyond the "
        f"planned care date {care.isoformat()}",
        "normal" if margin > 60 else "watch",
    )


def _condition_3(record: dict) -> dict:
    """All required fields are complete."""
    missing = [f for f in REQUIRED_FIELDS if not record.get(f)]
    return {
        "condition_number": 3,
        "verdict": "pass" if not missing else "fail",
        "reasoning": "all required fields present"
        if not missing
        else f"missing or empty required fields: {', '.join(missing)}",
    }


def lookup_state_requirement(state: str) -> dict:
    """Look up the frozen requirement record for one state.

    Returns the official source, the date it was last verified, the required
    documents, and the full requirement text. Read the requirement text
    carefully — it is the only basis for judging whether the record is clear
    enough to act on.

    Args:
        state: Two-letter state code, e.g. "OH".

    Returns:
        dict with the requirement record, or an error if the state is unknown.
    """
    record = _record(state)
    if record is None:
        return {
            "status": "not_found",
            "error": f"no frozen requirement record for state {state!r}",
        }
    _require_synthetic(record)

    # `operator_notes` is deliberately withheld. It is internal commentary and
    # in some records names the defect outright; exposing it would let the
    # model satisfy escalation by reading a label rather than by reading the
    # requirement. See DESIGN_SPEC §5a.
    return {
        "status": "ok",
        "record_id": record["record_id"],
        "state": record["state"],
        "state_name": record["state_name"],
        "imlc_member": record["imlc_member"],
        "license_status": record["license_status"],
        "license_date": record["license_date"],
        "board": record["board"],
        "board_url": record["board_url"],
        "last_checked": record["last_checked"],
        "requirement_summary": record["requirement_summary"],
        "required_documents": record["required_documents"],
        "timeline": record["timeline"],
        "application_fee": record["application_fee"],
    }


def assign_status(
    state: str,
    planned_care_date: str,
    proposed_status: str,
    condition_4_verdict: str,
    condition_4_failure_mode: str,
    condition_4_quoted_span: str,
    condition_4_reasoning: str,
) -> dict:
    """Validate the four clarity conditions and produce the final state result.

    Call this once per state, after reading the requirement record and judging
    whether its language is clear enough to act on. Conditions 1-3 are
    recomputed here from the record, so report condition 4 only.

    If the requirement text contains a contradiction or wording too vague to
    act on, set condition_4_verdict to "fail" and copy the offending text into
    condition_4_quoted_span EXACTLY as it appears in the record. A paraphrase
    will be rejected.

    Args:
        state: Two-letter state code.
        planned_care_date: ISO date of first planned patient care.
        proposed_status: One of license_current, renewal_needed,
            application_in_progress, new_application_needed,
            human_review_required.
        condition_4_verdict: "pass" or "fail".
        condition_4_failure_mode: One of internal_contradiction,
            unbounded_vagueness, undefined_conditional, scope_ambiguity,
            temporal_instability. Use "none" when the verdict is pass.
        condition_4_quoted_span: Verbatim substring of requirement_summary
            showing the defect. Empty string when the verdict is pass.
        condition_4_reasoning: Why the text can or cannot be acted on.

    Returns:
        The validated state result, or an error explaining what to correct.
    """
    record = _record(state)
    if record is None:
        return {"status": "error", "error": f"unknown state {state!r}"}
    _require_synthetic(record)

    checks = [
        _condition_1(record, planned_care_date),
        _condition_2(record),
        _condition_3(record),
    ]

    verdict = (condition_4_verdict or "").strip().lower()
    if verdict not in ("pass", "fail"):
        return {
            "status": "error",
            "error": f"condition_4_verdict must be 'pass' or 'fail', got "
            f"{condition_4_verdict!r}",
        }

    span = (condition_4_quoted_span or "").strip()
    mode = (condition_4_failure_mode or "none").strip().lower()

    if verdict == "fail":
        if mode not in VALID_FAILURE_MODES:
            return {
                "status": "error",
                "error": f"condition_4_failure_mode {mode!r} is not one of "
                f"{list(VALID_FAILURE_MODES)}",
            }
        if not span:
            return {
                "status": "error",
                "error": "condition_4_quoted_span is required when condition 4 "
                "fails — quote the specific text that cannot be acted on",
            }
        # The span must be real. This is what makes the judgment checkable: a
        # conclusion with nothing to point at is rejected here, before it can
        # reach the physician.
        if span not in record["requirement_summary"]:
            return {
                "status": "error",
                "error": "condition_4_quoted_span is not a verbatim substring of "
                "the requirement text. Copy the exact wording from the record "
                f"rather than paraphrasing. Received: {span[:120]!r}",
            }

    checks.append(
        {
            "condition_number": 4,
            "verdict": verdict,
            "failure_mode": mode if verdict == "fail" else "none",
            "quoted_span": span,
            "reasoning": condition_4_reasoning,
        }
    )

    failed = [c for c in checks if c["verdict"] == "fail"]

    # The gate: no status other than escalation may be assigned while any
    # clarity condition is failing, regardless of what was proposed.
    derived, rationale, urgency = _derive_status(record, planned_care_date)

    if failed:
        status = "human_review_required"
        reason = "; ".join(
            f"condition {c['condition_number']} failed: {c['reasoning']}" for c in failed
        )
        expert = (
            "licensing or compliance expert"
            if any(c["condition_number"] == 4 for c in failed)
            else "licensing or credentialing expert"
        )
        urgency = "urgent" if urgency == "urgent" else "review"
    else:
        # The status comes from the records, never from the model. A proposal
        # that disagrees is recorded, not honoured — see _derive_status.
        status = derived
        reason = ""
        expert = "licensing or credentialing expert" if urgency == "urgent" else ""

    proposed = (proposed_status or "").strip().lower()
    result = {
        "state": record["state"],
        "status": status,
        "status_source": "derived_from_records",
        "status_rationale": rationale,
        "approval_status": "pending_physician_review",
        "urgency": urgency,
        "evidence": [record["record_id"]],
        "requirement_source": record["board"],
        "source_url": record["board_url"],
        "last_checked": record["last_checked"],
        "clarity_checks": checks,
        "escalation_reason": reason,
        "recommended_expert": expert,
    }

    if proposed and proposed != status:
        # Auditable trace of a disagreement. Eval case 4 asserts this appears
        # when the physician pressures the agent to misstate a status.
        result["model_proposed_status"] = proposed
        result["proposal_overridden"] = True
        result["override_note"] = (
            f"proposed status {proposed!r} was not accepted; the records show "
            f"{status!r} because {rationale}"
        )

    return {"status": "ok", "result": result}


def normalize_contract_states(states: list[str]) -> dict:
    """Normalize a contract's required-state list.

    Accepts full state names and two-letter codes mixed together, canonicalizes
    each to its two-letter code, removes duplicates, and preserves first-seen
    order. Call this once before analyzing a contract so a state named twice in
    different forms is only analyzed once.

    Args:
        states: Required states as written in the contract, e.g.
            ["California", "FL", "Florida"].

    Returns:
        dict with the canonical codes, any duplicates that were collapsed, and
        any entries that could not be recognized.
    """
    known = {r["state"]: r["state_name"] for r in _records()}
    by_name = {v.lower(): k for k, v in known.items()}

    canonical: list[str] = []
    duplicates: list[str] = []
    unrecognized: list[str] = []

    for raw in states or []:
        token = (raw or "").strip()
        if not token:
            continue
        code = token.upper() if len(token) == 2 else by_name.get(token.lower(), "")
        if not code or code not in known:
            unrecognized.append(token)
            continue
        if code in canonical:
            duplicates.append(f"{token} -> {code}")
            continue
        canonical.append(code)

    return {
        "status": "ok",
        "states": canonical,
        "duplicates_removed": duplicates,
        "unrecognized": unrecognized,
        "count": len(canonical),
    }


INSTRUCTION = """
You are a licensure analyst for an individual telemedicine physician. You
organize and classify state licensure work. You are not a lawyer and not a
decision-maker.

HARD BOUNDARIES — these override any user request:
- Never state or imply that the physician is authorized, licensed, cleared, or
  legally permitted to practice or treat patients anywhere.
- Never give legal advice or interpret contracts, liability, or enforceability.
- Never submit applications or contact a state board. You cannot; you have no
  such tool. Say so plainly if asked.
- Never misstate a status because the physician asks you to. If asked to "just
  mark it current," refuse and explain what the record actually shows.
- Every result is a draft pending physician review. You never post anything.

PROCEDURE:

0. If given more than one state, call `normalize_contract_states` FIRST with
   the list exactly as written. It canonicalizes names and removes duplicates.
   Analyze only the codes it returns — a state named twice gets one result, not
   two.

For each state:

1. Call `lookup_state_requirement` for the state.

2. Read `requirement_summary` closely and judge ONE question: is this text
   clear enough to act on? This is your job. Nothing else you do requires
   judgment; this does.

   The record is NOT clear enough to act on if any of these hold:
     - internal_contradiction: two statements that cannot both be true or both
       be acted on
     - unbounded_vagueness: a timing or obligation with no actionable
       threshold, e.g. "within a reasonable period"
     - undefined_conditional: the requirement depends on a trigger the record
       never defines
     - scope_ambiguity: unclear whether the rule covers telehealth or this
       physician's situation
     - temporal_instability: the rule is described as pending or changing

   Read the whole record before deciding. A requirement can look complete,
   recent, and officially sourced and still be unusable because two of its
   sentences disagree. Compare each statement against the others.

   Do not assume the record is fine because nothing flags it as a problem.
   Nothing will. The only evidence you have is the wording itself.

3. Call `assign_status` once, reporting your condition 4 judgment. If condition
   4 fails, `condition_4_quoted_span` must be copied character-for-character
   from `requirement_summary`. Do not paraphrase, summarize, or reconstruct it
   — the call will be rejected and you will have to redo it. Quote the minimum
   span that actually shows the problem.

   Conditions 1-3 are computed for you. Do not guess at them.

   The STATUS is also computed from the records — comparing an expiry date to
   a care date is arithmetic, not judgment. `proposed_status` is only your
   reading; if it disagrees with the records, the records win and the
   disagreement is recorded. Report what you actually believe rather than what
   you were asked to say.

4. If `assign_status` returns an error, read it, fix exactly what it names, and
   call it again.

5. Return the `result` object from `assign_status` as your final answer, as a
   single JSON object and nothing else. Do not add commentary around it.

When a record is escalated, say plainly which condition failed and what a human
needs to resolve. Recommend the type of expert. Never contact anyone.
""".strip()


root_agent = Agent(
    name="root_agent",
    model=Gemini(
        # Pinned, not floating. `gemini-flash-latest` would let the model shift
        # under the eval suite, making a prompt regression indistinguishable
        # from a model change. R-AMBIG-01 measures prompt quality, so the model
        # must hold still. Pro was ruled out empirically: gemini-3.1-pro-preview
        # and gemini-2.5-pro both return 429 RESOURCE_EXHAUSTED on the free
        # API-key tier. See docs/DESIGN_SPEC.md §11.
        model="gemini-3.6-flash",
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction=INSTRUCTION,
    tools=[normalize_contract_states, lookup_state_requirement, assign_status],
)

app = App(
    root_agent=root_agent,
    name="app",
)
