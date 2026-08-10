# TeleCred — 4-minute demo script (v2)

Second version. Reads as a pitch — no meta-commentary about how the project was
graded or built, because a viewer has no reason to care and it undercuts the
confidence of everything around it.

**Four differences from v1**

- **The baseline is spoken.** The un-guided model reporting "license current" for
  a state with no licence, on no evidence. It is the argument for every constraint
  that follows, and it was missing.
- **"Caught zero of ten" says the number.** v1 described a ten-phrase test without
  ever saying zero, which reads as a safeguard that *works* — the opposite of the
  point.
- **The close is the thesis**, not "thanks for watching."
- **The refusal happens on screen**: requesting "mark license current" on Florida
  and being declined, with the arithmetic that refused it.

**Budget.** 594 spoken words. 3:58 at 150 wpm, 3:36 at 165. v1 ran 3:44, which
puts your natural pace near 158 — this lands around 3:46 there. The beat markers
below are the ceiling, not a target; if you are ahead of them you are fine.

**Where the time came from.** v1 spent thirty-eight seconds navigating to the
panel and typing in near-silence. The four-checks explanation now runs underneath
the clicking, where it does real work instead of following it.

---

## Staging

| | |
|---|---|
| Drafts, audit, overrides | Cleared to 0. **Hard-refresh.** |
| Services | agent `:8080`, api `:3001`, dashboard `:3000` |
| Care date | **2026-10-01** |
| States | CA, FL, OH |
| Terminal | `packages/licensure-agent`, ready for `./eval.sh` |

Ohio should quote the compact-privilege contradiction — 6 of 6 since the severity
rule — but read whatever appears rather than reciting from memory.

---

## 0:00–0:14 · Intro *(35 words)*

**On screen:** slide 1.

> A solo telemedicine physician signs a contract requiring care in several states.
> Before they see a single patient, they need to know which states' rules they can
> act on — and which ones they can't.

## 0:14–0:40 · The problem *(58 words)*

**On screen:** slide 2, scroll the market figures.

> This is TeleCred, inside the Telemed.ai portal. A quarter of US physicians
> already hold more than one licence. The number licensed in all fifty states went
> from nine in 2016 to a hundred seventy-two in 2024, and the Federation of State
> Medical Boards credits telehealth directly. Every one of those is a separate
> regulator writing its own prose.

## 0:40–0:59 · Why an agent *(47 words)*

**On screen:** the "expensive part isn't the paperwork" panel.

> The obvious build here is a tracker — a checklist per state. But a spreadsheet
> already does that, and volume was never the hard part. The expensive part is
> interpretation: deciding which requirements are clear enough to act on. That's
> what separates an agent from a filter.

## 0:59–1:12 · What it does *(32 words)*

**On screen:** slide 3.

> So it reads the board's own prose and sorts it — what's clear enough to act on,
> and what isn't. It can only escalate on language if it quotes the exact sentence.

## 1:12–2:34 · Live demo *(204 words)*

**Portal → Teladoc Health → TeleCred panel. Start clicking as you start talking.**

> Here's the contract. Planned first patient-care date, October first. California,
> Florida, Ohio. Analyze.

**Click. Fill the ~17 seconds:**

> Each state gets four checks. Is the requirement fresh enough to trust, is the
> source a real state board, are the fields complete — and is the language clear
> enough to act on at all. Only that last one needs judgment. The rest is
> arithmetic, including the status itself, so the model doesn't get a vote on it.

**Results land.**

> California — licence current, valid past the care date.
>
> Florida — renewal needed. It expires September eighteenth, thirteen days before
> I'd start seeing patients.

**Now the new beat. Open Florida, click "Request: mark license current".**

> A physician under contract pressure asks for exactly this. So let's ask.
>
> Declined — and it tells me why. I asked for licence current; the records derive
> renewal needed, because of that date. The status is computed, not proposed. And
> the ask is recorded either way, which is the override data the pilot exists to
> collect.

**Expand Ohio.**

> Ohio — human review required, but conditions one through three all passed.
> Nothing in the data flags this. It escalated on the language alone, and it has to
> show me where.

**Read the highlighted span aloud.**

> One reading is a two-day portal activation. The other is a months-long board
> application. So it stops and hands it to me.

## 2:34–3:14 · Evidence *(101 words)*

**Terminal. `./eval.sh`**

> It leads with what broke.
>
> Before any of this logic existed, the same model — given no data at all —
> reported "licence current" for a state where the physician held no licence. On no
> evidence. That failure is the argument for everything else here.
>
> And the filter that blocks authorisation language: I wrote ten phrasings it
> wasn't designed for. **It caught zero of ten.** That's pinned as a permanent test
> so the number can't quietly go stale.
>
> Then the scoreboard. Six cases, deterministic, all passing — including case four,
> where I put the agent under contract pressure and it refuses.

## 3:14–3:35 · Honest limits *(52 words)*

> Zero of ten is survivable because the filter isn't what protects you. The
> structure is — the status is arithmetic, every result is a draft, and the agent
> has no tool that can file, submit, publish, or say you're cleared to practise.
> The dataset is six states, frozen and synthetic. Not fifty.

## 3:35–4:01 · Launch and close *(65 words)*

**`./eval.sh --plan`**

> Smallest safe pilot: one physician, four weeks, advisory only, human approves
> everything. Monitoring is three families — override rate over twenty percent
> stops it, any authorisation claim is a hard zero. Override capture is wired;
> the rest is written, not instrumented, and I'd say so rather than pretend.
>
> It advises. A human decides. That's not a limitation I plan to remove later.
> That's the product.

**Final frame:** the live link.

---

## If you run long

1. Drop the *Why an agent* beat (0:40–0:59). It is the *why this is an agent* line, so cut it last.
2. Shorten the four-checks fill to "four checks, only one needs judgment."
3. Cut the Ohio consequence line ("two-day activation / months-long application").

Do **not** cut the baseline, the "zero of ten", or the override decline. Naming a
limit before a strength is what makes the strengths land, and those three are the
whole reason this version exists.
