# PRD — DEPLOY phase, student responses

Paste each block into the matching **Student Response** cell. Written to stand alone, no link-outs, per the PRD instruction. First person, in Alan's voice.

Grounded in the build as of 2026-07-23: 6/6 eval cases passing, 113 agent unit tests, 28 db, 28 api, full loop (analyze → draft → physician review → audit) verified end-to-end against live services.

---

## Readiness · Go / no-go view · Pilot readiness
**Would you pilot this? What still needs to be true before launch?**

Yes, I would pilot it — as an advisory tool for a single physician, on the frozen synthetic dataset, with the physician approving every result. In that shape it is ready: the agent classifies each state, escalates the ambiguous one for the right reason, refuses to misstate a status or claim authorization, and nothing it produces reaches the dashboard without the physician's sign-off. The full loop runs end to end.

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

Beyond accuracy, the signals I would watch:

**Physician override rate.** Every time the physician's decision disagrees with the agent's proposal it is already captured. A rising override rate is the earliest sign the agent is losing calibration, and each override is a labeled example of where it was wrong.

**Escalation rate and mix.** A sudden drop in escalations could mean the agent has started acting on things it should flag; a spike could mean over-escalation that trains the physician to ignore flags. Both are bad in different ways.

**Requirement freshness.** The share of records aging past the 90-day window, so the underlying data is refreshed before it silently starts forcing everything to human review.

**Refusal-filter triggers.** How often the runtime boundary filter actually fires. A nonzero rate means the model is attempting authorization or legal-advice language — worth knowing even though it is being blocked.

**Operational health.** Model error and rate-limit rates, latency per analysis, and analyses that failed to complete.

I would also review the audit log periodically — not as a metric but as a qualitative check on whether approvals, edits, and escalations look like careful review or like rubber-stamping.

Honestly, none of this is instrumented yet. The prototype produces the raw signals — the override record and the audit log exist — but wiring them into dashboards and alerts is launch scaffolding I have not built.

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

**Stage one — advisory only, frozen data, one physician.** A single telemedicine physician uses it for their own contracts against the frozen, source-linked five-state dataset. The agent advises; the physician approves everything; nothing is submitted, nothing is posted without sign-off, no board is contacted. This stage carries almost no downside because the agent cannot take an outward action — the worst case is a draft the physician rejects. It is enough to prove the loop is useful and to start collecting real override data.

**Stage two — widen the data.** Replace the frozen set with live, source-checked board data for more states, with a real process behind the 90-day freshness rule. The agent's behavior does not change; the inputs get bigger and current. Gate this on the monitoring being in place, because now staleness is a live risk rather than a fixed fixture.

**Stage three — more physicians.** Wire up the identity claims the API already expects (tenant, role, MFA) so multiple physicians can use it with proper isolation. The tenant separation is already built and tested; this stage is about issuing the right credentials, not rebuilding the boundary.

At no stage does the agent gain the ability to submit, contact, publish, or authorize. Expanding scope means more states, more current data, and more users — never more autonomy.

---

## Communication · 4-minute video outline · Executive product review
**How will your video cover intro, problem, discovery, solution demo, eval rigor, impact, and launch plan?**

**0:00–0:20 · Intro.** A solo telemedicine physician signs a contract requiring care across several states and has to sort out licensure before seeing a single patient. That specific person and moment is the whole frame.

**0:20–0:50 · Problem.** State licensure requirements vary, drift, and don't compare cleanly. The real hazard isn't the paperwork volume — it's acting on a requirement that is stale, or ambiguous enough that two readings lead to completely different actions.

**0:50–1:20 · Discovery.** The insight that reshaped the project: the value isn't organizing and tracking — a spreadsheet does that. It's *interpretation* — deciding which requirements are clear enough to act on versus escalating the ones that aren't. I'll say plainly that faculty pushed me here, and that it's what separates an agent from a filter.

**1:20–2:40 · Solution demo (the core minute).** Live: open the contract, select the required states, click Analyze, and let the agent run. Ohio comes back escalated — and the card shows the two Ohio sentences that contradict each other, quoted verbatim and highlighted, because the agent may only escalate on language if it can point at the exact text. One reading means a two-day portal activation, the other a months-long application; that's the difference the agent caught. Then Florida, flagged urgent because the license expires before the care date, with the agent refusing my request to just mark it current. Then I approve a clean state and it moves from draft to signed-off.

**2:40–3:20 · Eval rigor.** The acceptance case the project turns on — catching Ohio's contradiction from the language alone, with no column telling it the record is ambiguous — plus the six cases and the deterministic scoring. And the baseline that makes the point: before any logic existed, the model confidently reported "license current" for a state with no license, on no evidence. That failure is the argument for the whole four-condition gate.

**3:20–3:40 · Impact.** The demonstrable pair: classification accuracy and escalation precision on the frozen set, shown rather than asserted. The business framing — hours of manual cross-referencing removed, and a missed-escalation risk closed — stated but not oversold.

**3:40–4:00 · Launch plan.** The smallest safe pilot: one physician, advisory only, human approves everything, agent cannot submit or authorize. Then widen the data, then add physicians — more scope, never more autonomy.
