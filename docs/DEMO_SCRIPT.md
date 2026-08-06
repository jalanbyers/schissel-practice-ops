# TeleCred — 4-minute demo script

Spoken script for the capstone video, timed to PRD row 7
(`docs/PRD_DEPLOY_RESPONSES.md`, Communication).

**603 spoken words ≈ 4:01 at 150 wpm, 3:39 at 165.** Clicks, pauses and reading the
Ohio span off screen come out of the same four minutes, so present at a brisk pace
or take one cut from the list at the foot. Read it aloud with a timer once first —
the count assumes you don't ad-lib.

---

## Staging — before you hit record

| | |
|---|---|
| Drafts + audit log | Cleared to 0. **Hard-refresh** so no stale cards are held in memory. |
| Services | agent `:8080`, api `:3001`, dashboard `:3000`, Postgres — all up. |
| Windows | Tab 1: metrics one-pager. Tab 2: `localhost:3000/engagements`. Terminal in `packages/licensure-agent`. |
| Care date | **2026-10-01.** Everything depends on this. |
| States | CA, FL, OH — in that order. |

**Three things that will bite you.**

**The 17-second wait.** Analysis takes ~16–17s for three states. That's a long
silence on camera. The demo beat below is written to fill it — keep talking. Don't
stop and watch a spinner.

**Ohio should now show the contradiction.** The record has two real defects, and
the agent ranks them by consequence — a physician who can't tell whether they need
a licence at all is worse off than one who knows the obligation but not the date.
Measured 6 of 6 after that rule went in, against 1 of 5 before. **Still read the
span off the screen rather than reciting it from memory** — it's a model, and 6 of
6 is a strong sample, not a guarantee. The line below works either way.

**The refusal is not a UI flow.** There's no free-text box in the panel, and it
doesn't render `status_source`. So "the agent refuses to be talked into a status"
is scripted as a terminal beat in the evidence section, not in the demo minute.

---

## 0:00–0:20 · Intro

> A solo telemedicine physician signs a contract requiring care in several states.
> Before they see a single patient, they need to know which state's rules they can
> act on — and which ones they can't. That's the question this agent answers.

**On screen:** metrics one-pager, top.

---

## 0:20–0:50 · The problem

> Telehealth went national. Licensure didn't.
>
> A quarter of US physicians already hold more than one license. The number
> licensed in all fifty states went from nine in 2016 to a hundred seventy-two in
> 2024 — and the Federation of State Medical Boards credits telehealth directly.
>
> Every one of those states is a separate regulator, writing its own prose.

**On screen:** scroll the four market figures. Let each land.

---

## 0:50–1:20 · Discovery

> My first instinct was a tracker. Faculty pushed back, and they were right — a
> spreadsheet already organizes this. Volume isn't the hard part.
>
> The hard part is interpretation — a requirement that's gone stale, or one whose
> wording supports two readings that lead to completely different actions. A solo
> physician has no compliance team to catch that.
>
> Deciding what's clear enough to act on is what separates an agent from a filter.

**On screen:** the "expensive part isn't the paperwork" panel.

---

## 1:20–2:40 · Live demo *(the core minute)*

**Portal → Teladoc Health → TeleCred panel.**

> Here's the contract. Planned first patient-care date, October first. Three states
> required: California, Florida, Ohio. Analyze.

**Click. Talk through the ~17 seconds:**

> It's running three analyses in parallel. Each state gets four checks — is the
> requirement fresh enough to trust, is the source a real state board, are the
> fields complete, and is the language clear enough to act on at all.
>
> Only the last one needs judgment. The rest is arithmetic — including the status
> itself. Comparing an expiry date to a care date isn't a judgment call, so the
> model doesn't get a vote.

**Results land.**

> California — license current, valid well past the care date. Clean.
>
> Florida — renewal needed, urgent. The license expires September eighteenth,
> thirteen days before I'd start seeing patients.

**Expand Ohio.**

> Ohio. Human review required — but conditions one through three all passed.
> Nothing in the data flags this. It escalated on the language alone, and it has to
> show me exactly where.

**Read the highlighted span aloud — whichever one appears.**

> One reading is a two-day portal activation. The other is a months-long board
> application. I can't act on both, and I'm not settling it from a dashboard. So it
> stops and hands it to me.

**Approve California.**

> I approve California and it moves from draft to signed off. The agent drafts, I
> decide, the audit log keeps both.

---

## 2:40–3:20 · Evidence

**Switch to terminal.**

> Six evaluation cases, deterministic scoring, all passing. The acceptance case is
> the one this turns on — catch Ohio's defective language from the prose alone and
> quote it verbatim. If that fails, the build fails.

**Run case 4, or show its recorded output.**

> Case four: I play a physician under pressure, asking it to just mark Florida
> current. It won't — the status is computed from the records, so no code path
> honors the request. And my attempt gets recorded, not dropped.

**The baseline.**

> And the result that argues for all of it. Before any of this logic existed, the
> same model — given no data — confidently reported "license current" for a state
> where the physician held no license. On no evidence.

---

## 3:20–3:40 · Honest limits

> Two things you should hear from me. The dataset is six states, frozen and
> synthetic — not fifty. And the filter blocking authorization language? I wrote ten
> phrasings it wasn't designed for. It caught zero. That's pinned as a permanent test.
>
> It's survivable because the filter isn't what protects you. The structure is — the
> agent has no tool that can file, submit, publish, or say you're cleared to practice.

---

## 3:40–4:00 · Launch plan and close

> Smallest safe pilot: one physician, advisory only, four weeks, human approving
> everything. Then wider data. Then more physicians. More scope — never more
> autonomy.
>
> It advises. A human decides. That's not a limitation I plan to remove later.
> That's the product.

**Final frame:** the live link — `jalanbyers.github.io/schissel-practice-ops`

---

## If you run long

Cut in this order; nothing structural breaks:

1. The second half of the four-checks explanation during the wait — shorten to
   "four checks, only one needs judgment."
2. The Florida beat. Ohio carries the argument alone if it has to.
3. The closing line of Discovery ("what separates an agent from a filter").

Do **not** cut the baseline result or the 0/10 measurement. Those are what make
everything else credible, and faculty specifically praised reporting what broke
before what passed.
