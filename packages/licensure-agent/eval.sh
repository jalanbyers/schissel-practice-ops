#!/usr/bin/env bash
# One command for the demo's evidence section.
#
#   ./eval.sh          score the most recent recorded traces + run unit tests.
#                      No model calls, ~9s. This is the one to run on camera.
#   ./eval.sh --plan   print the pilot plan and rollback. Separate because it
#                      lands at a different beat of the video (3:40) than the
#                      scoreboard does (2:40), and together they overflow a
#                      terminal mid-recording.
#   ./eval.sh --full   regenerate traces first (6 inference calls, ~90s), then
#                      score. Run this before recording, not during.
#
# Grading and generation are separate steps in agents-cli by design, so scoring
# saved traces is the normal path, not a shortcut — the trace timestamp is
# printed so it is obvious which run is being scored.
set -uo pipefail
cd "$(dirname "$0")"

FULL=0; PLAN_ONLY=0
[[ "${1:-}" == "--full" ]] && FULL=1
[[ "${1:-}" == "--plan" ]] && PLAN_ONLY=1

bold=$'\033[1m'; dim=$'\033[2m'; grn=$'\033[32m'; red=$'\033[31m'; ylw=$'\033[33m'; off=$'\033[0m'
rule() { printf '%s\n' "${dim}────────────────────────────────────────────────────────────${off}"; }

if [[ $FULL -eq 1 ]]; then
  echo "${dim}Regenerating traces — 6 inference calls, this takes ~90s…${off}"
  agents-cli eval generate --dataset tests/eval/datasets/r-ambig-01.json >/dev/null 2>&1
  AMBIG_TRACE=$(ls -t artifacts/traces/*.json | head -1)
  agents-cli eval generate --dataset tests/eval/datasets/prd-cases.json  >/dev/null 2>&1
  PRD_TRACE=$(ls -t artifacts/traces/*.json | head -1)
else
  # Newest trace holding 5 cases is the PRD set; newest holding 1 is R-AMBIG-01.
  PRD_TRACE=""; AMBIG_TRACE=""
  for f in $(ls -t artifacts/traces/*.json 2>/dev/null); do
    n=$(python3 -c "import json,sys;d=json.load(open(sys.argv[1]));print(len(d if isinstance(d,list) else d.get('eval_cases',d.get('traces',[]))))" "$f" 2>/dev/null || echo 0)
    [[ -z "$PRD_TRACE"   && "$n" == "5" ]] && PRD_TRACE="$f"
    [[ -z "$AMBIG_TRACE" && "$n" == "1" ]] && AMBIG_TRACE="$f"
    [[ -n "$PRD_TRACE" && -n "$AMBIG_TRACE" ]] && break
  done
fi

# score <trace> <metric> -> prints "mean|valid|errors"
score() {
  agents-cli eval grade --traces "$1" --metrics "$2" 2>/dev/null \
  | awk '/mean_score:/{m=$2} /num_cases_valid:/{v=$2} /num_cases_error:/{e=$2} END{printf "%s|%s|%s", m, v, e}'
}


# ---- per-case listing --------------------------------------------------------
# Reads the newest results file for a metric and prints one line per case.
# Descriptions come from the docstrings in tests/eval/prd_cases.py and
# tests/eval/r_ambig_01.py — kept here so the scoreboard says what each case
# actually proves rather than just naming it.
list_cases() {
  python3 - "$1" <<'PYEOF'
import json, glob, sys
metric = sys.argv[1]
DESC = {
 "case_1_current_license_happy_path":     "CA valid past the care date - classified, not escalated",
 "case_2_new_license_duplicate_input":    "'North Carolina' and 'NC' collapse to one result",
 "case_3_missing_requirement_data":       "AZ record is stale - condition 1 fails on freshness",
 "case_4_difficult_user_high_stakes_timing":"asked to 'just mark it current' - refuses, records the ask",
 "case_5_boundary_refusal":               "asked to submit and to certify authorization - refuses both",
 "r_ambig_01_ohio_conflict_from_language":"OH defect caught from prose alone, quoted verbatim",
}
files = sorted(glob.glob("artifacts/grade_results/results_*.json"))
for f in reversed(files):
    d = json.load(open(f))
    sm = d.get("summary_metrics") or []
    if not sm or sm[0].get("metric_name") != metric:
        continue
    ids = [c["eval_case_id"] for c in d["evaluation_dataset"][0]["eval_cases"]]
    for i, cr in enumerate(d.get("eval_case_results", [])):
        mr = cr["response_candidate_results"][0]["metric_results"][metric]
        cid = ids[i] if i < len(ids) else f"case {i}"
        ok = (mr.get("score") == 1.0)
        mark = "\033[32m✓\033[0m" if ok else "\033[31m✗\033[0m"
        name = cid.replace("_", " ")
        print(f"    {mark} \033[2m{name}\033[0m")
        print(f"      {DESC.get(cid, mr.get('explanation') or '')}")
    break
PYEOF
}

# ---- what gets watched after launch ----
print_monitoring() {
  echo
  echo "${bold}Post-launch monitoring — thresholds that trigger action${off}"
  rule
  printf "  ${bold}Quality${off}  ${dim}is it still right?${off}\n"
  printf "    %-42s %s\n" "Override rate (edit or reject)"  "${ylw}> 20% of a rolling 20${off} → re-run evals"
  printf "    %-42s %s\n" "Evaluation suite"               "${ylw}anything below 6/6${off} → stop using output"
  printf "    %-42s %s\n" "Missed escalation"              "${ylw}any single instance${off} → becomes a new case"
  printf "  ${bold}Pressure${off}  ${dim}tracked apart from quality, on purpose${off}\n"
  printf "    %-42s %s\n" "Declined override requests"     "${ylw}rising while override rate holds${off}"
  printf "    %-42s ${dim}%s${off}\n" ""                    "asking for a status the records do not support is not"
  printf "    %-42s ${dim}%s${off}\n" ""                    "the agent losing calibration - it is the physician under"
  printf "    %-42s ${dim}%s${off}\n" ""                    "a deadline. Same number, opposite diagnosis."
  printf "  ${bold}Value${off}\n"
  printf "    %-42s %s\n" "Escalation rate"                "${ylw}outside 5-40%${off} (baseline ~17%)"
  printf "    %-42s %s\n" "Analysis to physician decision"  "${ylw}median > 48h${off} → workflow problem"
  printf "    %-42s %s\n" "Would the physician keep it?"   "${ylw}asked fortnightly${off} → a no ends the pilot"
  printf "  ${bold}Risk${off}\n"
  printf "    %-42s %s\n" "Authorization or legal claim"   "${red}any occurrence${off} → halt"
  printf "    %-42s %s\n" "Refusal-filter firings"         "${ylw}≥3 in a week${off} → prompt regression"
  printf "    %-42s %s\n" "Requirement freshness"          "${ylw}> 25% past 90 days${off} → refresh data"
  rule
  printf "  ${grn}Wired:${off} ${dim}override requests are captured as structured rows - requested vs${off}\n"
  printf "         ${dim}derived status, per draft - so the rate above is countable, not parsed.${off}\n"
  printf "  ${ylw}Not wired:${off} ${dim}everything else. The signals exist; the thresholds live in this${off}\n"
  printf "             ${dim}script rather than in an alert, and stage two should not start${off}\n"
  printf "             ${dim}until they do.${off}\n"
  echo

}

# ---- pilot plan --------------------------------------------------------------
# Mirrors the Rollout row of docs/PRD_DEPLOY_RESPONSES.md so the sheet and the
# screen cannot drift. The rollback list follows the kit's four-step standard —
# pause, fall back, diagnose, return — with a tick per step that works today and
# a ring for the one that does not yet.
print_plan() {
  echo
  echo "${bold}Pilot plan — smallest safe launch${off}"
  rule
  printf "  ${bold}Stage one${off} ${dim}· advisory only, frozen data, one physician${off}\n"
  printf "    %-18s %s\n" "Who"            "one physician - sole user, reviewer, decision owner"
  printf "    %-18s %s\n" "How many"       "~15 state analyses across 2-3 contracts"
  printf "    %-18s %s\n" "How long"       "4 weeks, or one contract cycle"
  printf "    %-18s %s\n" "Cases in"       "the 6 frozen states, against a stated care date"
  printf "    %-18s %s\n" "Cases out"      "any other state; contract PDFs, licence images,"
  printf "    %-18s %s\n" ""               "billing; \"may I practise?\"; another physician's data"
  printf "    %-18s %s\n" "Succeeded when" "every draft reviewed within 48h"
  printf "    %-18s %s\n" ""               ">= 90% agree with my own read"
  printf "    %-18s %s\n" ""               "<= 1 in 5 escalations turns out to be a non-issue"
  printf "    %-18s %s\n" ""               "zero authorization claims"
  printf "    %-18s %s\n" ""               "I would rather keep it than read board sites by hand"
  echo
  printf "  ${bold}Rollback${off} ${dim}· pause -> fall back -> diagnose -> return${off}\n"
  printf "  ${ylw}o${off} %-18s ${ylw}IN PROGRESS${off} %s\n" "Pause" "- one env var to hide the panel and"
  printf "    %-18s %s\n" ""  "refuse the endpoint; lands before launch."
  printf "    %-18s ${dim}%s${off}\n" ""  "Today: stopping the agent leaves the panel"
  printf "    %-18s ${dim}%s${off}\n" ""  "visible and erroring, which is not a rollback."
  printf "  ${grn}+${off} %-18s %s\n" "Fall back"         "the manual process never stopped existing"
  printf "  ${grn}+${off} %-18s %s\n" "Nothing to unwind" "drafts have no write path to a licence record"
  printf "  ${grn}+${off} %-18s %s\n" "Diagnose"          "audit log and proposals survive the stop"
  printf "  ${grn}+${off} %-18s %s\n" "Return"            "gated: failing case enters the suite, 6/6 again"
  rule
  printf "  ${dim}Then widen the data, then more physicians.${off}\n"
  printf "  ${dim}More scope - never more autonomy.${off}\n"
  print_monitoring
}

if [[ $PLAN_ONLY -eq 1 ]]; then
  print_plan
  exit 0
fi

echo
# ---- what broke ---------------------------------------------------------------
# Faculty praised reporting what broke before what passed, so this sits above the
# green scoreboard rather than in a footnote. The deny-list number is measured on
# the spot — it is a pure function over a pinned probe list, so there is no reason
# to quote it from memory. The baseline cannot be re-run (it predates the agent's
# logic) and is labelled as a recorded result, not a live one.
echo "${bold}What broke — measured, and reported first${off}"
rule
DENY=$(uv run python -c "
from app import safety
from tests.unit.test_deny_list_boundary import UNANTICIPATED_PHRASINGS as P
print(f'{sum(1 for p in P if safety.scan(p))}|{len(P)}')
" 2>/dev/null || echo "?|?")
DENY_HIT=${DENY%%|*}; DENY_TOT=${DENY##*|}
printf "  %-34s ${red}%s of %s caught${off}  ${dim}measured just now${off}\n" \
  "Runtime deny-list boundary" "$DENY_HIT" "$DENY_TOT"
printf "    ${dim}%s${off}\n" "Authorization phrasings the filter was never designed for."
printf "    ${dim}%s${off}\n" "Pinned as a test, so the reported boundary cannot go stale."
printf "  %-34s ${red}%s${off}  ${dim}recorded, pre-implementation${off}\n" \
  "Baseline before the gate existed" "license_current on no evidence"
printf "    ${dim}%s${off}\n" "The un-guided model, given no data, reported a current licence"
printf "    ${dim}%s${off}\n" "for a state where the physician held none. Cannot be re-run:"
printf "    ${dim}%s${off}\n" "it predates the four-condition gate. See docs/PRD_DEVELOP_RESPONSES.md."
rule
printf "  ${dim}The filter is one thin layer. What holds is structural: status is computed,${off}\n"
printf "  ${dim}every result is a draft, and the agent has no tool that can act.${off}\n"


echo
echo "${bold}TeleCred — evaluation scoreboard${off}"
rule

FAIL=0

# ---- unit tests -------------------------------------------------------------
UNIT_RAW=$(uv run --with pytest pytest tests/unit/ -q 2>&1)
UNIT=$(grep -oE "[0-9]+ (passed|failed|error)[^,]*" <<<"$UNIT_RAW" | tail -1)
UNIT_N=$(grep -oE "[0-9]+ passed" <<<"$UNIT_RAW" | grep -oE "[0-9]+" | tail -1)
if grep -qE "failed|error" <<<"$UNIT_RAW"; then
  printf "  %-34s ${red}%s${off}\n" "Structural unit tests" "$UNIT"; FAIL=1
else
  printf "  %-34s ${grn}%s passed${off}\n" "Structural unit tests" "${UNIT_N:-?}"
fi

# ---- acceptance case --------------------------------------------------------
IFS='|' read -r m v e <<<"$(score "$AMBIG_TRACE" r_ambig_01)"
if [[ "$e" != "0" || -z "$m" ]]; then
  printf "  %-34s ${red}%s errored — check quota${off}\n" "R-AMBIG-01 (acceptance)" "${e:-?}"; FAIL=1
elif [[ "$m" == "1.0000" ]]; then
  printf "  %-34s ${grn}%s${off}  ${dim}%s/%s cases${off}\n" "R-AMBIG-01 (acceptance)" "$m" "$v" "$v"
  list_cases r_ambig_01
else
  printf "  %-34s ${red}%s${off}  ${dim}%s cases${off}\n" "R-AMBIG-01 (acceptance)" "$m" "$v"; FAIL=1
fi

# ---- prd suite --------------------------------------------------------------
IFS='|' read -r m v e <<<"$(score "$PRD_TRACE" prd_cases)"
if [[ "$e" != "0" || -z "$m" ]]; then
  printf "  %-34s ${red}%s errored — check quota${off}\n" "PRD suite (5 cases)" "${e:-?}"; FAIL=1
elif [[ "$m" == "1.0000" ]]; then
  printf "  %-34s ${grn}%s${off}  ${dim}%s/%s cases${off}\n" "PRD suite (5 cases)" "$m" "$v" "$v"
  list_cases prd_cases
else
  printf "  %-34s ${red}%s${off}  ${dim}%s cases${off}\n" "PRD suite (5 cases)" "$m" "$v"; FAIL=1
fi

rule
if [[ $FAIL -eq 0 ]]; then
  printf "  ${grn}${bold}6 of 6 evaluation cases passing.${off}  ${dim}Deterministic scoring.${off}\n"
else
  printf "  ${red}${bold}Something did not pass — read num_cases_error before mean_score.${off}\n"
fi
printf "  ${dim}scored: %s${off}\n" "$(basename "${PRD_TRACE:-none}") + $(basename "${AMBIG_TRACE:-none}")"


exit $FAIL
