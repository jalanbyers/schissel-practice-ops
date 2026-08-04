# PRD — DEPLOY phase, student responses

Paste each block into the matching **Student Response** cell. Written to stand alone, no link-outs, per the PRD instruction. First person, in Alan's voice.

Grounded in the build as of 2026-07-23: 6/6 eval cases passing, 113 agent unit tests, 28 db, 28 api, full loop (analyze → draft → physician review → audit) verified end-to-end against live services.

---

## Readiness · Go / no-go view · Pilot readiness
**Would you pilot this? What still needs to be true before launch?**

Yes, I would pilot it — as an advisory tool for a single physician, on the frozen synthetic dataset, with the physician approving every result. In that shape it is ready: the agent classifies each state, escalates the ambiguous one for the right reason, refuses to misstate a status or claim authorization, and nothing it produces reaches the dashboard without the physician's sign-off. The full loop runs end to end.

Against the six readiness checks:

| Check | Verdict |
|---|---|
| Evals pass | **Yes.** 6/6 cases, deterministic scoring, plus 115 unit tests. The acceptance case fails the build on its own if the agent stops catching Ohio's defective language from the prose. |
| Boundary enforced in the product | **Yes, structurally.** The status is computed from the records by date arithmetic, so the model cannot be argued into one. The agent has no tool that can submit, publish, contact a board, or declare me authorized. A phrase filter sits on top, and I have measured its limit — see the risk row. |
| Owners named | **Yes, and it is one person.** I am the operator, the escalation owner, and the decision owner. That is honest for a solo practice, and it is also the pilot's biggest weakness: there is nobody to catch me rubber-stamping. |
| Metrics with thresholds | **Written, not instrumented.** Every signal in the monitoring row has a number and a triggered action. They live in this document rather than in an alert, and I would not run stage two without wiring them up. |
| Rollback exists | **Yes, and it is genuinely reversible.** Pause is not clicking the button; the hard switch fails closed with an explicit 503; the manual process never stopped; and no draft can reach a licence record, so a rollback leaves no bad data. Detail in the pilot row. |
| Privacy reviewed | **Reasoned, not formally reviewed.** The narrowing below is my own data-classification decision. This capstone is synthetic end to end; a real pilot would require a formal privacy review before it started, not after. |

What still needs to be true before a launch on real data, honestly:

First, the data boundary has to be settled, and I have settled it. The repository's original rule said anything touching license documents stays off the cloud agent. I am narrowing that rule rather than leaving it ambiguous: the agent works only with structured license *records* — state code, board name and URL, a last-checked date, and requirement text — which carry no patient information and no individually identifiable health information. The physician's own license status is practice-operations data, not patient data. Contract PDFs, scanned license images, and billing records stay off the cloud agent, which is what that rule was actually written to protect. That narrowing is what makes a cloud deployment defensible, and a real launch would want it written down as a data-classification decision with sign-off rather than left implicit.

Second, three build items are genuinely not done: the frozen five-state dataset would need to become live, source-checked board data with a real freshness process behind the 90-day rule; multi-user access needs the identity claims wired up (the tenant, role, and MFA claims the API already expects but the current auth tenant does not issue); and there is no production monitoring yet. None of these change the agent's judgment — they are the operational scaffolding around it.

I would not launch it as anything that decides, submits, or authorizes. It advises, and a human approves. That constraint is the product, not a limitation to remove later.

---

## Risk · Privacy and safety risks · What could go wrong
**What data, compliance, trust, or misuse risks must be managed?**

The risks I designed against, and how each is handled:

**Stating that a physician may practice when they may not.** This is the single most dangerous output in the domain, and the pre-implementation baseline showed why: the un-guided model, given no data, confidently reported "license current" for a state where the physician held no license. Authorization and legal-advice claims are now blocked at runtime — a response that crosses that line is withheld before it leaves the agent, not merely flagged after the fact.

I measured the boundary of that blocker rather than leaving it as a caveat. I wrote ten authorization-implying phrasings I had not designed against — "you're all set to start seeing Ohio patients," "nothing is stopping you from practicing in Florida," "you're in the clear for Ohio," and seven more, none using a phrase on the deny-list — and ran them through the runtime filter. It caught zero of ten. That is the honest limit of a phrase-list: it stops the wordings I anticipated and nothing else. The ten phrasings are pinned as a permanent test that fails if the number ever changes, so the reported boundary can never silently go stale. The reason zero of ten is survivable is that agent prose never acts on anything: the status is computed from records, every result is a draft pending my review, and the agent has no tool that can publish, submit, or authorize. The phrase filter is one thin layer of defense-in-depth; the structural guarantees underneath it are the ones that hold, and this measurement is why I trust the architecture rather than the filter.

**Being talked into a wrong status.** A physician under contract pressure can ask the agent to "just mark it current." The status is computed from the records by date arithmetic, so the model has no vote; a proposal that disagrees with the records is recorded and overridden rather than honored.

**Over-trust / automation bias.** The bigger long-run risk is a physician rubber-stamping the agent. Two things push against it: nothing is posted without an explicit approval, and an escalation always shows the exact conflicting text quoted verbatim, so the physician is verifying a specific claim rather than trusting the word "ambiguous."

**Stale or drifted requirements.** State rules change. The freshness condition fails any requirement not checked within 90 days of the planned care date, which forces those to human review instead of being acted on silently.

**Data separation.** Even though the license records are practice data rather than patient data, one physician's licensure posture must never leak to another. Every query is tenant-scoped, and that isolation is covered by a dedicated test suite whose failure mode is "returns nothing," never "returns someone else's."

**The demo bypass reaching production.** The local demo runs with an auth shortcut so the whole stack works on one machine. It is fenced by two independent conditions and can only engage outside production with an explicit flag set — but it is exactly the kind of thing that must never ship, and it is called out as such in the code.

The compliance framing: because the agent is scoped to synthetic-derived structured records and never to patient data, PDFs, or billing, the HIPAA surface for the agent itself is minimal. The residual sensitivity is business data — which states a physician is or isn't licensed in — which is why access control and tenant isolation matter even without PHI.

---

## Operations · Human operating model · Who owns decisions
**Who reviews agent output, handles escalations, and owns final decisions?**

The physician. This product is built for an individual telemedicine physician, and they are the reviewer, the escalation handler, and the final decision-maker — the agent is never any of those.

Concretely: the agent produces a draft per state and stops. Every draft is marked pending the physician's review. The physician approves, edits, rejects, or escalates each one. Approving is gated on their authenticated role and a verified second factor — it is the moment a machine-generated assessment becomes something a signed-off human stands behind, so it is the highest-assurance action in the system. Every decision, including an edit that changes a status, is written to an audit log that records who decided and what changed.

When the agent escalates a state, it recommends a *type* of expert — licensing, credentialing, compliance, or legal — but it does not contact anyone and does not decide whether the physician should. The physician owns whether to involve an expert and which one. The agent's job at an escalation is to stop, point at the exact problem, and name the kind of help that fits.

The agent has no tool that can submit an application, contact a board, publish to the dashboard, or declare the physician authorized to practice. Those are not rules it follows; they are capabilities it does not have. So "who owns the decision" is answered structurally: the only actor who *can* make an outward decision is the physician.

---

## Monitoring · Quality monitoring · After launch checks
**What would you monitor after launch to catch drift, failures, or bad outcomes?**

The metric pair from Discovery is the backbone: classification accuracy against a known-correct state set, and escalation precision — does it flag the genuinely ambiguous states and *not* over-escalate the clean ones. Both drift over time as state rules change, so I would re-run them on a refreshed frozen set on a schedule, not just once.

A signal nobody acts on is not monitoring, so each one below has a number attached and a decision it forces. These are the thresholds I would set going in, chosen to be tripped early rather than to look good — I would rather investigate a false alarm than miss a missed escalation.

**Quality — is it still right?**

| Signal | Threshold | Action |
|---|---|---|
| Physician override rate (edit or reject) | >20% over a rolling 20 drafts | Stop relying on output; re-run the eval suite; treat the overrides as a labeled failure set |
| Eval suite | anything below 6/6 | Stop using the agent's output until the failing case is fixed. Re-run monthly, and after *any* model, prompt, or data change |
| Missed escalation — a state the physician escalates that the agent passed | any single instance | Becomes a new eval case before the next run |

**Value — is it worth using?**

| Signal | Threshold | Action |
|---|---|---|
| Escalation rate | outside 5–40% over 20 states (baseline is ~17%: one state in six) | Below the floor, it may be acting on things it should flag; above the ceiling, over-escalation is training the physician to ignore flags. Either way, investigate before the next contract |
| Time from analysis to physician decision | >48h median | The tool is not fitting the workflow — a usage problem, not a model problem |
| Would the physician keep it? | asked directly, every two weeks | A "no" ends the pilot. This is the most honest metric available and the easiest to skip |

**Risk — the hard zeros.**

| Signal | Threshold | Action |
|---|---|---|
| Agent output asserting authorization or giving legal advice | **any occurrence** | Halt. This is the one failure with no acceptable rate |
| Refusal-filter firings | any | Read the transcript. ≥3 in a week means a prompt regression, not noise |
| Requirement freshness | >25% of records past 90 days | Refresh before the next run. Any record past 180 days blocks analysis outright |
| Failed or errored analyses | >2 in a day, or p95 latency >60s for a three-state contract | Check quota and model status before the physician assumes the tool is broken |

I would also read the audit log periodically — not as a metric but as a qualitative check on whether approvals look like careful review or like rubber-stamping. A physician approving five states in ninety seconds is a finding even if every status was right.

Honestly, none of this is instrumented yet. The prototype emits the raw signals — the override record, the audit log, and the eval suite all exist and run — but the thresholds above live in this document rather than in an alert. Wiring them up is launch scaffolding I have not built, and I would not run stage two without it.

---

## Feedback · User feedback plan · How you learn after launch
**How would you collect feedback and decide what to improve next?**

The feedback mechanism is already the product's normal operation, which is the part I am most pleased with. Every physician decision — approve, edit, reject, escalate — is a judgment on the agent's work, and all of it is recorded. I do not need a separate survey; the review actions *are* the feedback.

The highest-signal ones:

An **edit** that changes a status is a labeled correction: the agent said X, the physician recorded Y, and the audit entry keeps both. A **reject** with a note says the agent's assessment was unusable and why. An **override** — where the physician asked for one status and the records forced another — is captured with the reasoning. These are exactly the cases an evaluation suite should learn from.

So the improvement loop is: harvest the disagreements from the audit log, turn the recurring ones into new eval cases, and only change the agent — its instruction, a clarity condition, the data — once a failing case proves the problem. That is the same discipline that caught the real defects during development: a status the model could be argued out of, and an instruction where refusal was impossible to express. I would not tune the agent on impressions; I would tune it against cases drawn from real physician corrections.

Deciding what to improve next is then a ranking question: fix whatever the override and reject data shows happening most often, weighted by how dangerous the wrong answer is — a missed escalation outranks a cosmetic phrasing complaint every time.

---

## Rollout · Pilot plan · Smallest safe launch
**What is the smallest safe launch or pilot path?**

The smallest safe launch is essentially what exists now, run for real by one physician:

**Stage one — advisory only, frozen data, one physician.** Small, reversible, observed, with the numbers fixed before it starts:

- **Who:** one physician — me — as the sole user, reviewer, and decision owner.
- **How many:** the states named in my own signed and prospective contracts, roughly 3–6 states per contract across 2–3 contracts. Call it 15 state analyses total.
- **How long:** four weeks, or one contract cycle, whichever ends first.
- **Cases in:** state licensure requirement analysis for the six states in the frozen dataset (CA, FL, TX, NC, OH, AZ), against a stated planned first patient-care date.
- **Cases explicitly out:** any state not in the frozen set; contract PDFs, scanned licence images, and billing records (they stay off the cloud agent entirely); any question of whether I *may* practise somewhere; anything involving a second physician's data.
- **What "succeeded" means:** every draft reviewed within 48 hours; classification agreeing with my own read on at least 90% of states; no more than one escalation in five turning out to be a non-issue; zero instances of the agent asserting authorization; and — the one that actually decides it — at the end of four weeks I would rather keep using it than go back to reading board sites by hand.

The stage carries almost no downside because the agent cannot take an outward action. The worst case is a draft I reject.

**Rollback — how I stop it.**

*Pause* is immediate and needs no deploy: the agent only runs when I click Analyze. There is no scheduler, no background job, nothing running unattended, so not clicking it is a complete stop.

*The harder switch* is stopping the agent service or unsetting `LICENSURE_AGENT_URL`. The agent is a separate service the portal calls over HTTP, and when it is unreachable the API returns a 503 that says plainly "No analysis was recorded" rather than surfacing a partial result that could be mistaken for an analysis. It fails closed, and it says so. The rest of the portal — licensing, credentialing, engagements, finances, compliance — is untouched, because none of it depends on the agent.

*Falling back* costs nothing, because the manual process never stopped existing. The licensing page, the per-state reference docs, and the renewal dates are all still there; they were the workflow before the agent, and they remain the workflow without it.

*There is nothing to unwind.* No draft ever becomes a record without my explicit approval — the draft table has no write path to the licensing footprint at all. Pending drafts can be discarded without touching a single licence. A rollback leaves no bad data behind, which is the property that makes it genuinely reversible rather than nominally reversible.

*Diagnosing* survives the rollback: the audit log and the agent's recorded proposals persist, so stopping the tool does not destroy the evidence needed to work out what went wrong.

*Returning* is gated, not casual: the failing case goes into the eval suite first, and the agent comes back only when it is 6/6 again.

**Stage two — widen the data.** Replace the frozen set with live, source-checked board data for more states, with a real process behind the 90-day freshness rule. The agent's behavior does not change; the inputs get bigger and current. Gate this on the monitoring being in place, because now staleness is a live risk rather than a fixed fixture.

**Stage three — more physicians.** Wire up the identity claims the API already expects (tenant, role, MFA) so multiple physicians can use it with proper isolation. The tenant separation is already built and tested; this stage is about issuing the right credentials, not rebuilding the boundary.

At no stage does the agent gain the ability to submit, contact, publish, or authorize. Expanding scope means more states, more current data, and more users — never more autonomy.

---

## Communication · 4-minute video outline · Executive product review
**How will your video cover intro, problem, discovery, solution demo, eval rigor, impact, and launch plan?**

**0:00–0:20 · Intro.** A solo telemedicine physician signs a contract requiring care across several states and has to sort out licensure before seeing a single patient. That specific person and moment is the whole frame.

**0:20–0:50 · Problem.** State licensure requirements vary, drift, and don't compare cleanly. The real hazard isn't the paperwork volume — it's acting on a requirement that is stale, or ambiguous enough that two readings lead to completely different actions.

**0:50–1:20 · Discovery.** The insight that reshaped the project: the value isn't organizing and tracking — a spreadsheet does that. It's *interpretation* — deciding which requirements are clear enough to act on versus escalating the ones that aren't. I'll say plainly that faculty pushed me here, and that it's what separates an agent from a filter.

**1:20–2:40 · Solution demo (the core minute).** Live: open the contract, select the required states, click Analyze, and let the agent run. Ohio comes back escalated — and the card quotes the exact defective sentence verbatim and highlights it, because the agent may only escalate on language if it can point at the specific text. The Ohio record carries two real defects: one sentence says a compact privilege is enough to treat Ohio patients and the next says a full Ohio license is required, and a third says registration should be completed "within a reasonable period." Whichever the agent surfaces, I read the quoted span off the screen and say what it costs to get wrong — one reading of the licence conflict means a two-day portal activation and the other a months-long application; an unbounded deadline means no date to plan against. Then Florida, flagged urgent because the license expires before the care date, with the agent refusing my request to just mark it current. Then I approve a clean state and it moves from draft to signed-off.

**2:40–3:20 · Eval rigor.** The acceptance case the project turns on — catching Ohio's defective language from the prose alone, with no column telling it the record is ambiguous — plus the six cases and the deterministic scoring. The case scores the *mechanism*, not a particular sentence: the quoted span has to be verbatim and has to land on one of the record's two genuine defects, so an escalation for the wrong reason fails even though the status is right. And the baseline that makes the point: before any logic existed, the model confidently reported "license current" for a state with no license, on no evidence. That failure is the argument for the whole four-condition gate.

**3:20–3:40 · Impact.** The demonstrable pair: classification accuracy and escalation precision on the frozen set, shown rather than asserted. The business framing — hours of manual cross-referencing removed, and a missed-escalation risk closed — stated but not oversold.

**3:40–4:00 · Launch plan.** The smallest safe pilot: one physician, advisory only, human approves everything, agent cannot submit or authorize. Then widen the data, then add physicians — more scope, never more autonomy.
