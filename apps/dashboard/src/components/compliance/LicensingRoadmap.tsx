'use client';

import { Map, CheckCircle2, Clock, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface Phase {
  num: string;
  title: string;
  subtitle: string;
  color: 'ok' | 'info' | 'warn' | 'idle';
  steps: string[];
  states?: { code: string; note: string }[];
}

const PHASES: Phase[] = [
  {
    num: '1',
    title: 'Solidify the Home State',
    subtitle: 'NH first — everything else depends on it',
    color: 'ok',
    steps: [
      'Keep the NH license in continuous active standing — IMLC compact privileges are suspended the moment the home state license lapses.',
      'Renew at least 90 days before the April 30 biennial deadline to leave buffer for board processing delays.',
      'Confirm NH is designated as the IMLC home state in the Compact Commission portal before applying for any compact privilege.',
      'Maintain DEA registration and NH PDMP account current — board checks these at renewal.',
    ],
    states: [
      { code: 'NH', note: 'Home · biennial · Apr 30' },
    ],
  },
  {
    num: '2',
    title: 'Activate IMLC Compact Privileges',
    subtitle: 'Fastest path — no separate applications, no board interviews',
    color: 'info',
    steps: [
      'With NH current, apply for compact privileges directly via imlcc.net — approval is typically 24–72 hours per state.',
      'Prioritize states by revenue opportunity and patient demand; compact privileges can be activated one at a time or all at once.',
      'Compact privileges renew automatically as long as the NH home license stays active — no per-state renewal paperwork.',
      'Note: compact privilege is tied to the home state license cycle, not the compact state\'s own biennial calendar, so there is no independent expiration date to track.',
    ],
    states: [
      { code: 'IL', note: 'active · Jan 31 biennial' },
      { code: 'GA', note: 'expiring · Aug 10' },
      { code: 'PA', note: 'in progress' },
      { code: 'WA', note: 'active · Jun 30 annual' },
      { code: 'VA', note: 'active · Mar 15 biennial' },
      { code: 'OH', note: 'not yet applied' },
      { code: 'AZ', note: 'active · Feb 28 biennial' },
    ],
  },
  {
    num: '3',
    title: 'Apply for Non-IMLC Licenses',
    subtitle: 'Full applications required — stagger to avoid renewal clustering',
    color: 'warn',
    steps: [
      'Submit non-IMLC state applications in descending order of revenue opportunity; each takes 8–16 weeks so plan the queue accordingly.',
      'Stagger submission dates by 6–8 weeks so renewal windows land in different months — this prevents a single quarter from being overwhelmed with CME and renewal fees.',
      'Use FCVS (Federation Credentials Verification Service) to centralize primary-source verifications once; each participating board can then pull from FCVS instead of requiring fresh paperwork.',
      'CA and NY are the longest to process (10–16 weeks); submit those first in the queue. TX and NC are faster (8–12 weeks) and can follow.',
      'MA, FL, and TX allow online applications with real-time status tracking — check weekly and respond to board requests within 48 hours to avoid queuing delays.',
    ],
    states: [
      { code: 'MA', note: 'active · Dec 15 biennial' },
      { code: 'CA', note: 'active · Dec 31 biennial' },
      { code: 'TX', note: 'in progress' },
      { code: 'FL', note: 'expiring · Jul 20' },
      { code: 'NY', note: 'in progress · triennial' },
      { code: 'NC', note: 'not yet applied' },
    ],
  },
];

const TIMING_TIPS = [
  {
    icon: Clock,
    title: 'Apply mid-cycle, not at expiration',
    body: 'Most boards issue a license dated to the day of approval, and the renewal clock starts from that date. Applying in the middle of a board\'s biennial cycle means the first renewal falls at the full-cycle mark — maximizing the life of the initial license fee.',
  },
  {
    icon: CheckCircle2,
    title: 'NY triennial = most life per dollar',
    body: 'New York\'s 3-year cycle at $315 is the best cost-per-month value in the portfolio. Prioritize keeping NY current — triennial licenses also reduce the administrative burden of annual CME attestation cycles.',
  },
  {
    icon: Zap,
    title: 'Stack CME completions in Q4',
    body: 'Most biennial renewals fall on January 31, April 30, or December 31. Completing CME in October–November each year keeps all renewal cycles covered regardless of which state\'s window opens next. CE Broker and AMA PRA credit banks hold credits across states.',
  },
  {
    icon: Map,
    title: 'Track renewals 120 days out, not 30',
    body: 'Board processing delays are common (FL, CA, PA can take 4–6 weeks just to process a renewal submission). Initiating 120 days before expiration leaves two full cycles of follow-up time before the license goes delinquent and late fees apply.',
  },
];

const COLOR_CLASSES: Record<string, { border: string; badge: string; header: string }> = {
  ok:   { border: 'border-color: color-mix(in srgb, var(--ok) 22%, var(--border))',   badge: 'background:var(--ok-bg);color:var(--ok)',     header: 'color:var(--ok)' },
  info: { border: 'border-color: color-mix(in srgb, var(--info) 22%, var(--border))', badge: 'background:var(--info-bg);color:var(--info)',  header: 'color:var(--info)' },
  warn: { border: 'border-color: color-mix(in srgb, var(--warn) 22%, var(--border))', badge: 'background:var(--warn-bg);color:var(--warn)',  header: 'color:var(--warn)' },
  idle: { border: 'border-color: color-mix(in srgb, var(--idle) 22%, var(--border))', badge: 'background:var(--idle-bg);color:var(--idle)',  header: 'color:var(--idle)' },
};

export function LicensingRoadmap() {
  return (
    <div style={{ marginTop: 'var(--gap-grid)' }}>
      <Card
        title="50-State Licensing Roadmap"
        desc="Sequential strategy for building a full telehealth footprint — home state first, IMLC compact second, direct applications last."
      >
        {/* Phase columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--gap-grid)', marginBottom: 'var(--gap-grid)' }}>
          {PHASES.map((phase) => {
            const c = COLOR_CLASSES[phase.color]!;
            return (
              <div
                key={phase.num}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: 'var(--surface-2)',
                }}
              >
                {/* Phase header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      display: 'grid', placeItems: 'center',
                      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14,
                      flexShrink: 0,
                      ...Object.fromEntries(c.badge.split(';').map(s => { const [k,v] = s.split(':'); return [k?.trim().replace(/-([a-z])/g, (_,l)=>l.toUpperCase()), v?.trim()]; }).filter(([k])=>k)),
                    }}
                  >
                    {phase.num}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', letterSpacing: '-.005em' }}>{phase.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{phase.subtitle}</div>
                  </div>
                </div>

                {/* Steps */}
                <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {phase.steps.map((step, i) => (
                    <li key={i} style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{step}</li>
                  ))}
                </ol>

                {/* State pills */}
                {phase.states && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    {phase.states.map(({ code, note }) => (
                      <div key={code} title={note}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                          padding: '2px 8px', borderRadius: 5,
                          background: 'var(--primary-tint)', color: 'var(--primary-700)',
                          border: '1px solid var(--primary-50)',
                        }}>
                        {code}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
                <div key={tip.title}
                  style={{
                    display: 'flex', gap: 12, padding: '13px 14px',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface)',
                  }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'var(--primary-50)', color: 'var(--primary-700)',
                    display: 'grid', placeItems: 'center',
                  }}>
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
