'use client';

import { useState } from 'react';
import { Plus, Check, Map, CheckCircle2, Clock, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { ChecklistTask, ChecklistGroup } from '@/lib/types';

export interface RoadmapStep {
  id: string;
  label: string;
  desc: string;
  group: ChecklistGroup;
  date: string;
}

interface Phase {
  num: string;
  title: string;
  subtitle: string;
  color: 'ok' | 'info' | 'warn';
  steps: RoadmapStep[];
  states?: { code: string; note: string }[];
}

export const ROADMAP_STEPS: RoadmapStep[] = [
  // Phase 1 — NH home state (most foundational, earliest dates)
  { id: 'rm-p1-s0', label: 'Renew FL license before Jul 20 expiration',              group: 'Licensing', date: '2026-06-22', desc: 'Expiring soonest — initiate renewal at flhealthsource.gov immediately. Late fee jumps to $729 after expiration.' },
  { id: 'rm-p1-s1', label: 'Confirm NH designated as IMLC home state',               group: 'Licensing', date: '2026-06-25', desc: 'Verify NH is the registered home state in the Compact Commission portal at imlcc.net — all compact privileges depend on this.' },
  { id: 'rm-p1-s2', label: 'Verify DEA registration current (NH address)',            group: 'Licensing', date: '2026-06-28', desc: 'NH board checks DEA status at every renewal. Confirm the registered address matches the NH practice address.' },
  { id: 'rm-p1-s3', label: 'Confirm NH PDMP account active',                         group: 'Licensing', date: '2026-07-01', desc: 'NH PDMP (prescription monitoring) account must be in good standing before the biennial renewal is processed.' },
  { id: 'rm-p1-s4', label: 'Schedule NH biennial renewal (initiate by Jan 30, 2027)', group: 'Licensing', date: '2026-07-05', desc: 'NH license expires Apr 30 — board recommends initiating 90 days early. Set calendar block for Jan 30, 2027.' },
  // Phase 2 — IMLC compact (quick wins once NH is solid)
  { id: 'rm-p2-s0', label: 'Apply for GA compact renewal — expiring Aug 10',         group: 'Licensing', date: '2026-07-08', desc: 'GA compact privilege expires Aug 10. Initiate via imlcc.net; compact approvals are typically 24–72 hours.' },
  { id: 'rm-p2-s1', label: 'Activate IMLC compact in OH (not yet applied)',          group: 'Licensing', date: '2026-07-12', desc: 'OH is an IMLC member — apply for compact privilege via imlcc.net. No board interview, no paperwork beyond the portal.' },
  { id: 'rm-p2-s2', label: 'Prioritize remaining IMLC states by revenue (IL, WA, VA, AZ)', group: 'Licensing', date: '2026-07-18', desc: 'IL, WA, VA, AZ compact privileges can all be activated in one session at imlcc.net. Rank by patient demand.' },
  { id: 'rm-p2-s3', label: 'Audit all active compact privileges in IMLC portal',    group: 'Licensing', date: '2026-08-05', desc: 'Confirm each compact state shows "Active" status. NH renewal auto-renews all compact privileges — set that reminder too.' },
  // Phase 3 — Non-IMLC direct applications (longest queue)
  { id: 'rm-p3-s0', label: 'Set up FCVS profile for centralized credentialing',     group: 'Licensing', date: '2026-07-14', desc: 'FCVS (Federation Credentials Verification Service) centralizes primary-source verifications. Each board pulls from it instead of requiring fresh paperwork per state.' },
  { id: 'rm-p3-s1', label: 'Submit CA license application (10–16 week queue)',      group: 'Licensing', date: '2026-08-01', desc: 'CA has the longest processing time and highest fee ($1,014 application). Submit first to let it run in parallel with other steps.' },
  { id: 'rm-p3-s2', label: 'Submit NY license application (12–16 week queue)',      group: 'Licensing', date: '2026-08-08', desc: 'NY NYSED portal runs 12–16 weeks. Submit immediately after CA. NY\'s triennial cycle ($315 / 3yr) gives best cost-per-month once issued.' },
  { id: 'rm-p3-s3', label: 'Submit TX and NC applications (8–12 week queue)',       group: 'Licensing', date: '2026-09-01', desc: 'TX and NC process faster. Stagger ~6 weeks behind CA/NY so renewal windows don\'t cluster. Use FCVS credentials for both.' },
  { id: 'rm-p3-s4', label: 'Schedule MA renewal reminder (due Dec 15, biennial)',   group: 'Licensing', date: '2026-09-15', desc: 'MA license expires Dec 15. Set a reminder to initiate 90 days out (Sep 15). CE Broker tracks MA CME hours — verify 50 hrs completed.' },
];

const PHASES: Phase[] = [
  {
    num: '1',
    title: 'Solidify the Home State',
    subtitle: 'NH first — everything else depends on it',
    color: 'ok',
    steps: ROADMAP_STEPS.filter(s => s.id.startsWith('rm-p1')),
    states: [{ code: 'NH', note: 'Home · biennial · Apr 30' }],
  },
  {
    num: '2',
    title: 'Activate IMLC Compact Privileges',
    subtitle: 'Fastest path — 24–72 hr approvals, no board interviews',
    color: 'info',
    steps: ROADMAP_STEPS.filter(s => s.id.startsWith('rm-p2')),
    states: [
      { code: 'IL', note: 'active · Jan 31' },
      { code: 'GA', note: 'expiring · Aug 10' },
      { code: 'PA', note: 'in progress' },
      { code: 'WA', note: 'active · Jun 30' },
      { code: 'VA', note: 'active · Mar 15' },
      { code: 'OH', note: 'not yet applied' },
      { code: 'AZ', note: 'active · Feb 28' },
    ],
  },
  {
    num: '3',
    title: 'Apply for Non-IMLC Licenses',
    subtitle: 'Full applications — stagger to avoid renewal clustering',
    color: 'warn',
    steps: ROADMAP_STEPS.filter(s => s.id.startsWith('rm-p3')),
    states: [
      { code: 'MA', note: 'active · Dec 15' },
      { code: 'CA', note: 'active · Dec 31' },
      { code: 'TX', note: 'in progress' },
      { code: 'FL', note: 'expiring · Jul 20' },
      { code: 'NY', note: 'in progress' },
      { code: 'NC', note: 'not yet applied' },
    ],
  },
];

const TIMING_TIPS = [
  { icon: Clock,        title: 'Apply mid-cycle for max license life',  body: 'Most boards issue a license dated to approval day — the renewal clock starts there. Applying mid-cycle means the first renewal falls at the full-cycle mark, maximizing value per application fee.' },
  { icon: CheckCircle2, title: 'NY triennial = best cost per month',    body: 'New York\'s 3-year cycle at $315 is the best value in the portfolio. Prioritize keeping NY current — it also cuts annual CME attestation overhead.' },
  { icon: Zap,          title: 'Stack CME completions in Q4',           body: 'Most biennial renewals fall Jan 31, Apr 30, or Dec 31. Completing CME in Oct–Nov each year covers every renewal window. CE Broker and AMA PRA credit banks carry hours across states.' },
  { icon: Map,          title: 'Start renewals 120 days out — not 30', body: 'FL, CA, and PA can take 4–6 weeks just to process a renewal submission. 120 days leaves two full follow-up cycles before a license goes delinquent and late fees kick in.' },
];

const PHASE_BADGE: Record<string, React.CSSProperties> = {
  ok:   { background: 'var(--ok-bg)',   color: 'var(--ok)'   },
  info: { background: 'var(--info-bg)', color: 'var(--info)' },
  warn: { background: 'var(--warn-bg)', color: 'var(--warn)' },
};

interface Props {
  tasks: ChecklistTask[];
  onCreateTask: (step: RoadmapStep) => Promise<void>;
}

export function LicensingRoadmap({ tasks, onCreateTask }: Props) {
  const [creating, setCreating] = useState<string | null>(null);

  const isCreated = (step: RoadmapStep) => tasks.some(t => t.task === step.label);

  const handleCreate = async (step: RoadmapStep) => {
    if (isCreated(step) || creating === step.id) return;
    setCreating(step.id);
    try { await onCreateTask(step); } finally { setCreating(null); }
  };

  return (
    <div style={{ marginTop: 'var(--gap-grid)' }}>
      <Card
        title="50-State Licensing Roadmap"
        desc="Sequential strategy for building a full telehealth footprint. Click + to add any step as a tracked task."
      >
        {/* Phase columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--gap-grid)', marginBottom: 'var(--gap-grid)' }}>
          {PHASES.map((phase) => (
            <div key={phase.num} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--surface-2)' }}>
              {/* Phase header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, flexShrink: 0, ...PHASE_BADGE[phase.color] }}>
                  {phase.num}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', letterSpacing: '-.005em' }}>{phase.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{phase.subtitle}</div>
                </div>
              </div>

              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {phase.steps.map((step) => {
                  const created = isCreated(step);
                  const busy = creating === step.id;
                  return (
                    <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, color: created ? 'var(--ink-3)' : 'var(--ink-2)', lineHeight: 1.45, textDecoration: created ? 'line-through' : 'none' }}>
                          {step.label}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, lineHeight: 1.4 }}>{step.desc}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCreate(step)}
                        disabled={created || busy}
                        title={created ? 'Task already created' : 'Add as task'}
                        style={{
                          flexShrink: 0,
                          width: 24, height: 24, borderRadius: 6, border: '1px solid',
                          display: 'grid', placeItems: 'center', cursor: created ? 'default' : 'pointer',
                          background: created ? 'var(--ok-bg)' : 'var(--surface)',
                          borderColor: created ? 'var(--ok)' : 'var(--border)',
                          color: created ? 'var(--ok)' : 'var(--ink-3)',
                          opacity: busy ? 0.5 : 1,
                          transition: 'all .12s',
                          marginTop: 2,
                        }}
                      >
                        {created ? <Check size={12} /> : <Plus size={12} />}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* State pills */}
              {phase.states && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  {phase.states.map(({ code, note }) => (
                    <div key={code} title={note} style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: 'var(--primary-tint)', color: 'var(--primary-700)', border: '1px solid var(--primary-50)' }}>
                      {code}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Timing tips */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--gap-grid)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 12 }}>
            Timing Strategy
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {TIMING_TIPS.map((tip) => {
              const Icon = tip.icon;
              return (
                <div key={tip.title} style={{ display: 'flex', gap: 12, padding: '13px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'var(--primary-50)', color: 'var(--primary-700)', display: 'grid', placeItems: 'center' }}>
                    <Icon size={15} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)', marginBottom: 4 }}>{tip.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>{tip.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
