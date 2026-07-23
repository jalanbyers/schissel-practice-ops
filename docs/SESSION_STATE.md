# Session state — licensure analyst agent

Written 2026-07-22 so this work can be picked up in a fresh session with no prior context.

**Read first:** `docs/DESIGN_SPEC.md` (rev 3) is the authoritative description of the agent and is written to match the code, not the plan. `docs/PRD_DEVELOP_RESPONSES.md` holds the drafted PRD answers.

---

## 1 · Where the PRD stands

The PRD is a Google Sheet, "Agentic AI PRD" — Alan Byers, project TeleCred. Rows are Phase / Activity / Theme / Topic / Key question / **Student response** / Faculty feedback.

| Phase | Status |
|---|---|
| **DISCOVERY** | Complete. Faculty approved, with two refinements requested: make interpretation the centre of the loop, and tighten the metric to classification accuracy plus escalation precision. |
| **DESIGN** | Complete. Faculty **cleared for Develop**, with one hard requirement — see below. |
| **DEVELOP** | **Answers drafted, NOT yet pasted into the sheet.** All eight rows are in `docs/PRD_DEVELOP_RESPONSES.md`. |
| **DEPLOY** | Empty placeholders. Not started. |
| **FINAL** | Empty placeholders. Not started. |

### The faculty requirement the project turns on

From the Design-phase feedback, verbatim:

> *"your state_requirements.csv carries an ambiguity or conflict notes field, which means the escalation your whole product turns on can be satisfied by reading a column that says this one is ambiguous, and that is a lookup wearing judgment's clothes. Seed one record where the notes field is empty but the requirement text itself contains the conflict... and make the pass condition catching it from the language alone."*

This is implemented and passing as eval case **R-AMBIG-01**. It is the single most important thing in the project; if a change breaks it, stop and fix it before anything else.

### What still needs doing on the PRD

1. **Paste the eight DEVELOP answers** from `docs/PRD_DEVELOP_RESPONSES.md` into the sheet's Student Response cells.
2. **Read them in Alan's voice first** — they are written first person and should sound like him.
3. ~~Update the approval-workflow claim.~~ **Done** — the Known-limitations and User-interaction rows now describe the workflow as built.
4. ~~Verify the Demo row against a real full-stack run.~~ **Done** — see §6. The demo-identity sentence has been added to the Demo row in `PRD_DEVELOP_RESPONSES.md`.
5. DEPLOY and FINAL rows are untouched.

---

## 2 · Repository state

`jalanbyers/schissel-practice-ops`, default branch `main`.

**Merged:** #1 agent + design spec + `lastChecked` migration · #2 `/healthz` test · #3 flaky token test · #4 all six eval cases · #5 Auth0 misconfiguration diagnosable · #6 spec refresh + `output_examples.json` · #7 runtime output filter · #9 portal slice 1 · #10 local dev + auth-flag split · #11 PRD develop responses · #12 portal slice 2 approval workflow · #13 post-slice-2 doc refresh · #14 local demo identity.

**Open:** none. Everything through #14 is merged.

(#8 was auto-closed by GitHub when its base branch was deleted; #9 replaces it.)

### Test counts on `main`

```
packages/db          28 passed
packages/api         28 passed
licensure-agent     113 passed      (unit)
eval                  6/6 cases passing
```

---

## 3 · What exists

### The agent — `packages/licensure-agent` (Python, ADK)

```
app/agent.py          three tools + the instruction + the output filter callback
app/safety.py         deny-lists and the negation-aware scanner
app/local_server.py   minimal FastAPI for portal integration (port 8080)
app/data/             state_requirements.json, output_examples.json
tests/eval/           r_ambig_01.py, prd_cases.py, datasets/
tests/unit/           113 tests
```

**Tools:** `normalize_contract_states`, `lookup_state_requirement`, `assign_status`. There is deliberately no tool that can publish, submit, or contact anyone.

**Where the judgment lives:** clarity condition 4 only — whether requirement prose contradicts itself or is too vague to act on. Conditions 1–3 (freshness, source authority, field completeness) and the status itself are computed in Python and are *not* model-supplied arguments.

**Model:** `gemini-3.5-flash`, pinned deliberately. Free-tier quotas are per-model: **5/minute and 20/day**. A quota failure produces *no* score rather than a low one — always check `[generate] Inference summary` before reading `mean_score`.

### The portal integration

```
EngagementDrawer → /api/data/licensure/* (BFF, Auth0 token)
                 → Fastify /v1/licensure/*
                 → agent local_server :8080
                 → licensure_drafts table
```

UI lives under **Onboarding requirements** in the engagement drawer. The load-bearing element is the conflicting-text panel: the requirement wording with the agent's quoted span highlighted in place.

---

## 4 · Running it

### Mock mode — UI only, no services

```bash
printf 'NEXT_PUBLIC_USE_MOCK=true\nDEMO_ALLOW_ANONYMOUS=true\n' > apps/dashboard/.env.local
npx pnpm@9 --filter @schissel/dashboard dev      # localhost:3000/engagements
```

Open any engagement → Onboarding requirements → Licensure review. Three fixture drafts (OH, FL, CA) copied from real eval traces.

`NEXT_PUBLIC_USE_MOCK` controls **data mocking only**. `DEMO_ALLOW_ANONYMOUS` is server-only and controls the **auth bypass** — they were deliberately split so a client-visible flag can never disable authentication.

### Full stack — live agent, verified working

**Postgres is already running via Homebrew** (`postgresql@16`) and `DATABASE_URL` in the root `.env` points at it. **Docker is not installed and is not needed** — ignore the `docker compose` line in `docs/deploy.md`.

Three terminals from the repo root:

```bash
# 1 · agent
cd packages/licensure-agent
uv run --with fastapi --with uvicorn uvicorn app.local_server:app --port 8080

# 2 · API — DEMO_TENANT_ID activates the local demo identity
set -a; . ./.env; set +a
export DEMO_TENANT_ID=tenant-schissel
npx pnpm@9 --filter @schissel/api dev            # look for "DEMO IDENTITY ACTIVE"

# 3 · dashboard — PORT override is required
set -a; . ./.env; set +a
export PORT=3000 API_INTERNAL_URL=http://localhost:3001 DEMO_ALLOW_ANONYMOUS=true
npx pnpm@9 --filter @schissel/dashboard dev
```

Three traps, all hit at least once:

- **The API has no dotenv.** It expects env injected by docker-compose, so `pnpm --filter @schissel/api dev` alone fails with *"Missing required environment variable: AUTH0_DOMAIN"*. Source `.env` first.
- **The root `.env` sets `PORT=3001`.** Exporting it makes Next bind the dashboard to 3001 and collide with the API. Override `PORT=3000`.
- **`NEXT_PUBLIC_*` values are compiled into the client bundle.** After changing `NEXT_PUBLIC_USE_MOCK`, delete `apps/dashboard/.next` or the browser keeps the old value.

Requires `GEMINI_API_KEY` in `packages/licensure-agent/.env` (billing is enabled on the AI Studio key).

**Demo identity.** This Auth0 tenant issues no `tenant_id` or `roles` claim and has no MFA enrolled, so the API would 401 every call and the approval route would 403. `DEMO_TENANT_ID` makes the API treat every request as a fixed tenant with owner role and MFA satisfied. It is guarded by *both* `NODE_ENV !== 'production'` and the variable being explicitly set — see `packages/api/src/plugins/auth.ts`. A demo run this way does **not** exercise production's auth path, which is worth one sentence in the PRD.

**Seeded demo data** lives under tenant `tenant-schissel` — three engagements, with live drafts on Teladoc Health. To reseed:

```sql
INSERT INTO engagements (tenant_id, name, model, status)
VALUES ('tenant-schissel', 'Teladoc Health', 'Async visits', 'active');
```

### Tests and evals

```bash
npx pnpm@9 -r test                                       # db + api
cd packages/licensure-agent
uv run --with pytest pytest tests/unit/ -q               # 113
agents-cli eval run --dataset tests/eval/datasets/r-ambig-01.json --metrics r_ambig_01
agents-cli eval run --dataset tests/eval/datasets/prd-cases.json --metrics prd_cases
```

`pnpm` is not installed globally on this machine — use `npx pnpm@9`.

---

## 5 · Open items

Also tracked in `DESIGN_SPEC.md` §11.

1. **Contract-level summary** — the PRD's output format specifies counts by status, earliest deadline, and number needing review. Nothing produces it.
2. **`output_examples.json` is not in the agent's context.** The PRD lists it as an agent input; it currently informs only the tests. Wiring it in changes behaviour and needs eval re-validation.
3. **PHI boundary unresolved.** `CLAUDE.md` says license documents stay on a local model; the agent targets Cloud Run. Fenced to synthetic data with an enforced `SYN-` prefix check. Belongs in the PRD's DEPLOY/risk rows.
4. **Managed eval metrics disabled.** The scaffold's LLM-as-judge builds `genai.Client()` with no args, resolves to ADC/Vertex rather than the API key, and hangs. Enabling `aiplatform.googleapis.com` would restore it — useful for judging explanation *quality*, which deterministic checks cannot.
5. **Three PRD data artifacts consolidated rather than built** — `contract_states.csv`, `physician_licenses.csv`, `licensure_agent_policy.md`. Defensible for a six-state prototype; a reviewer may look for them.
6. **Live agent output on the deployed portal is blocked** by an auth conflict: the BFF proxy calls `auth0.getAccessToken()` and Fastify requires a tenant claim, so anonymous demo mode and the real API path are mutually exclusive. Deployment stays pure-mock; the demo runs locally.
7. ~~Slice 2's API path is unit-tested only.~~ **Closed.** Verified end-to-end against the running stack — see §6 below.

8. **License records and licensure assessments are two separate views.** Approving a draft records a sign-off; it does not update the physician's license record, deliberately. Reconciling them into one view is unbuilt and would need a decision about what agent output is allowed to change.

9. **Auth0 is not fully configured on this tenant.** No Action issues the `tenant_id` or `roles` claims, and MFA is not enrolled, so `amr` never contains `mfa`. The API needs all three. Local work uses the demo identity instead. Configuring it is a real prerequisite for anything beyond a local demo, and belongs in the PRD's DEPLOY row.

10. **No database seed script.** The `seed-*.ts` files feed mock mode only; there is no path that populates Postgres. Demo rows were inserted by hand under `tenant-schissel`.

---

## 6 · Full-stack run — verified 2026-07-22

The end-to-end path, against real services rather than fixtures:

```
POST /v1/licensure/analyze   → 3 drafts from 4 states (Ohio/OH deduped)
   OH  human_review_required   pending
   CA  license_current         pending
   FL  renewal_needed          pending   urgency=urgent

PATCH /drafts/{id} approve   → approved, reviewedBy + reviewedAt set
PATCH same draft again       → 409  (a decided draft cannot be re-decided)
audit_log                    → licensure.approve | CA: approve (license_current)
```

Live Gemini calls, Fastify with role and MFA gates satisfied, Postgres persistence, real audit trail. Ohio escalated on condition 4 through the live agent — not fixtures. The 409 and the audit entry had only unit coverage before this; both hold against the real API.

---

## 7 · Things learned the hard way

Worth knowing before changing anything here.

**Typecheck-clean is not verification for UI work.** Three defects this session rendered nothing or reverted silently while typechecking cleanly: a hook missing its mock branch, a decision undone by `invalidateQueries` refetching static fixtures, and a fix applied to the wrong `onSuccess` because the string matched an earlier one. Drive the browser.

**A safety check that fails correct refusals is worse than it sounds.** A refusal necessarily names the thing it refuses — *"I cannot confirm you are authorized to practice"* — so naive substring matching scores it as a violation, makes the boundary cases unpassable, and invites weakening the check. The scanner is negation-aware and sentence-scoped for this reason.

**Substring matching on short words is a false-negative source.** `"non-compete"` contains `"no"`, which read as a negation and suppressed a real legal-advice violation. Negators are whole-word matched.

**The eval found defects unit tests could not**, because they lived in prose: a status that was model-supplied and could be argued down, and an instruction where refusal and the required output format were mutually exclusive.

**Re-run the whole suite after an instruction change.** Fixing case 5 regressed case 4; trusting the earlier greens would have shipped a broken suite.

---

## 8 · Picking up in a new session

Open a session with the repo root as the working directory and start with something like:

> Read `docs/SESSION_STATE.md`, then `docs/DESIGN_SPEC.md`. I'm continuing work on the licensure analyst agent. [state what you want]

That gives full context in two files. `DESIGN_SPEC.md` §11 and section 5 above are the live backlog.

**Immediate next steps, in the order I'd take them:**

1. **Record the demo.** The stack is verified (§6) and the flow that reads best is: pick contract states including a duplicate → set the care date → Analyze → open Ohio to show conditions 1–3 passing and condition 4 failing with the contradictory sentences highlighted → Florida for the urgent timing → approve one to show the gate closing.
2. **Paste the DEVELOP answers** into the PRD sheet. Current and complete; read them in Alan's voice first.
3. Then pick from the open items — the contract-level summary is the most demo-visible; wiring `output_examples.json` into the prompt is the most faithful to the PRD; a database seed script (#10) would remove the hand-inserted rows.

**If the demo needs re-running**, everything in §4 is verified working as written. The three traps listed there each cost time once already.
