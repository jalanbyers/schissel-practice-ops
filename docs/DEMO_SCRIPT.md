# TeleCred — 4-minute demo script (v2)

Rewritten after the first recording. Three things the first take lost are back,
and the override-request beat is new.

**What changed and why**

- **The baseline was missing entirely.** Faculty called it "the single most useful
  result in your sheet." It is now spoken.
- **"Caught zero of ten" was never said.** The first take described a ten-phrase
  test without the number, which reads as a safeguard that *works*. The number is
  the point.
- **The close was "thanks for watching."** It is now the product thesis.
- **New: the refusal happens on screen.** Requesting "mark license current" on
  Florida and being declined, with the arithmetic that refused it.

**Budget.** 583 spoken words. 3:53 at 150 wpm, 3:32 at 165. The first take ran
3:44, so this fits at the pace you already used.

**Where the time came from.** The first take spent 0:46–1:24 — thirty-eight
seconds — navigating to the panel and typing. That is now covered by narration
that does real work, so the clicking happens under the four-checks explanation
instead of in silence.

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

## 0:40–0:56 · Discovery *(36 words)*

**On screen:** the "expensive part isn't the paperwork" panel.

> My first instinct was a tracker. Faculty pushed back, and they were right — a
> spreadsheet already organises this. The expensive part isn't the volume. It's
> interpretation, and that's what separates an agent from a filter.

## 0:56–1:08 · What it does *(32 words)*

**On screen:** slide 3.

> So it reads the board's own prose and sorts it — what's clear enough to act on,
> and what isn't. It can only escalate on language if it quotes the exact sentence.

## 1:08–2:30 · Live demo *(204 words)*

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

## 2:30–3:12 · Evidence *(101 words)*

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

## 3:12–3:30 · Honest limits *(52 words)*

> Zero of ten is survivable because the filter isn't what protects you. The
> structure is — the status is arithmetic, every result is a draft, and the agent
> has no tool that can file, submit, publish, or say you're cleared to practise.
> The dataset is six states, frozen and synthetic. Not fifty.

## 3:30–3:57 · Launch and close *(65 words)*

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

1. Drop the Discovery beat (0:40–0:56). Costs a point on criterion 1 — do this last.
2. Shorten the four-checks fill to "four checks, only one needs judgment."
3. Cut the Ohio consequence line ("two-day activation / months-long application").

Do **not** cut the baseline, the "zero of ten", or the override decline. Those are
the three things the first take was missing, and they are why this version exists.
