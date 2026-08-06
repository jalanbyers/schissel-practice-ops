# Telemed.ai — Practice Operations Platform

A telemedicine practice-operations portal with **TeleCred**, an embedded licensure analyst agent
that reads state medical-board requirements, decides which are clear enough to act on, and
escalates the ones that are not.

**Live demo:** https://jalanbyers.github.io/schissel-practice-ops/ — the licensure agent,
run on your own Gemini key. Nothing is stored.

Built as the capstone for Product Faculty's Agentic AI course.

---

## What it does

The portal covers five workspaces — licensing, credentialing, engagements, finances, and
compliance. The agentic part is TeleCred, inside an engagement.

You give it a planned first patient-care date and the states a contract requires. For each state it
runs four clarity checks and returns a draft, pending your review:

1. Was the requirement checked within 90 days of the care date?
2. Is the source an authoritative state board?
3. Are the required fields present?
4. **Is the requirement language actually clear enough to act on?**

Only the fourth is a model judgment. The first three are arithmetic, and so is the licence status
itself — comparing an expiry date to a care date is not a judgment call, so the model gets no vote
on it. If a state's prose contradicts itself or leaves a deadline undefined, the agent escalates and
**must quote the offending text verbatim**; it cannot escalate on a feeling.

Nothing it produces becomes a record without an explicit human approval. It has no tool that can
submit an application, contact a board, publish, or declare anyone authorised to practise.

---

## About the data and this repository

**This repository is public, and every record in it is synthetic.** The state requirement text,
licence dates, payers, engagements, and finances are fabricated for the capstone. There is no
patient data anywhere in it, and no real practice data.

Contract PDFs, scanned licence images, and billing records are out of scope for the agent by design
— it works only with structured licence *records*. See [CLAUDE.md](CLAUDE.md) and
[docs/PRD_DEPLOY_RESPONSES.md](docs/PRD_DEPLOY_RESPONSES.md) for the data-classification reasoning.

---

## Run the agent yourself

The public demo page is static, which is what makes it safe: it has no server, so your key goes
from your browser straight to the agent service that makes the model call and touches nothing in
between. It is never stored.

To watch it actually run, bring your own key. Three tiers, cheapest first.

### Tier 1 — the UI, no key, no database

```bash
pnpm install && pnpm --filter dashboard dev
```

Open http://localhost:3000. Same demo mode as the public link.

### Tier 2 — the real agent on your own key (recommended)

The agent runs standalone. No Postgres, no API, no dashboard — just the agent and your key.

Get a free Gemini API key at https://aistudio.google.com/apikey, then write it into the agent's
env file:

```bash
echo "GEMINI_API_KEY=your-key-here" > packages/licensure-agent/.env
```

Start the agent:

```bash
cd packages/licensure-agent && uv run --with fastapi --with uvicorn uvicorn app.local_server:app --port 8080
```

Ask it about the three states from the demo:

```bash
curl -s -X POST http://localhost:8080/analyze -H 'content-type: application/json' -d '{"contract_id":"demo","states":["CA","FL","OH"],"planned_care_date":"2026-10-01"}' | python3 -m json.tool
```

Expect roughly 17 seconds and three drafts: California current, Florida `renewal_needed` and urgent
because the licence expires before the care date, and Ohio `human_review_required` with a verbatim
`quoted_span` pointing at the defective sentence.

Ohio's record carries two genuine defects — a contradiction about whether a compact privilege
suffices, and an unbounded "within a reasonable period" deadline. The agent ranks defects by
consequence and reports the most serious, so expect the contradiction: a physician who cannot tell
whether they need a licence at all is worse off than one who knows the obligation but not the date.
Measured 6 of 6 after that rule, against 1 of 5 before it. The acceptance test still accepts either
span — ranking is a judgment, and one sample is not a guarantee.

Run the tests the same way:

```bash
cd packages/licensure-agent && uv run pytest tests/unit -q
```

### Tier 3 — the full stack

Adds Postgres and the Fastify API so drafts persist and the approve / reject / escalate loop writes
to an audit log. Requires Postgres running and `DATABASE_URL` set — copy [.env.example](.env.example)
and fill it in, then run the dashboard, the API, and the agent together.

---

## Layout

```text
apps/dashboard              Next.js 15 portal (App Router)
packages/api                Fastify 5 API — tenant-scoped, auth-gated
packages/db                 Drizzle schema, queries, migrations
packages/licensure-agent    Google ADK agent (Python) — the TeleCred analyst
docs/                       Design spec, PRD responses, session state
```

Key reading: [docs/DESIGN_SPEC.md](docs/DESIGN_SPEC.md) for the architecture and why each constraint
exists, and [packages/licensure-agent/README.md](packages/licensure-agent/README.md) for the agent
and its evaluation suite.

---

## Honest limits

- The state dataset is frozen and synthetic. A real deployment would need live, source-checked board
  data with a freshness process behind the 90-day rule.
- The runtime phrase filter that blocks authorisation claims was measured against ten authorisation
  phrasings it was not designed for and **caught zero of them**. That number is pinned as a permanent
  test. It is survivable because the structural guarantees do the real work: the status is computed
  from records, every result is a draft, and the agent has no tool that can act. See the risk section
  of [docs/PRD_DEPLOY_RESPONSES.md](docs/PRD_DEPLOY_RESPONSES.md).
- Monitoring thresholds are written down but not instrumented.
- Multi-user access needs identity claims the API expects but the current auth tenant does not issue.

This is a capstone prototype under human review, not a production system.
