// Overview — server component.
// Reads mock data server-side and passes it down as props.
// No PHI persisted client-side; data arrives via SSR.

import { ShieldCheck, Briefcase, DollarSign, ShieldAlert } from 'lucide-react';
import { KpiStat } from '@/components/ui/KpiStat';
import { Card } from '@/components/ui/Card';
import { TileMap } from '@/components/overview/TileMap';
import { BarChart } from '@/components/overview/BarChart';
import { ExpenseBreakdown } from '@/components/overview/ExpenseBreakdown';
import { CredentialingTable } from '@/components/overview/CredentialingTable';
import { ActiveEngagements } from '@/components/overview/ActiveEngagements';
import { ComplianceChecklist } from '@/components/overview/ComplianceChecklist';
import {
  MOCK_KPIS, MOCK_STATES, MOCK_PAYERS,
  MOCK_FINANCES, MOCK_ENGAGEMENTS, MOCK_CHECKLIST,
} from '@/lib/mock-data';
import type { LucideIcon } from 'lucide-react';

const KPI_ICONS: Record<string, LucideIcon> = {
  licenses:    ShieldCheck,
  engagements: Briefcase,
  revenue:     DollarSign,
  tasks:       ShieldAlert,
};

const SECTION_HREFS: Record<string, string> = {
  licensing:    '/licensing',
  engagements:  '/engagements',
  finances:     '/finances',
  compliance:   '/compliance',
};

export default function OverviewPage() {
  const activeCount = MOCK_STATES.filter(s => s.status === 'active').length;
  const imlcCount   = MOCK_STATES.filter(s => s.imlc).length;

  return (
    <div className="dash-grid">

      {/* ── 1. KPI row ── */}
      {MOCK_KPIS.map((kpi) => (
        <KpiStat
          key={kpi.id}
          label={kpi.label}
          value={kpi.value}
          trend={kpi.trend}
          trendLabel={kpi.trendLabel}
          sub={kpi.sub}
          Icon={KPI_ICONS[kpi.id] ?? ShieldCheck}
          href={SECTION_HREFS[kpi.section] ?? '/overview'}
        />
      ))}

      {/* ── 2. Multi-state licensing tile map ── */}
      <div className="col-7">
        <Card
          title="Multi-state licensing"
          desc={`${activeCount} active · ${MOCK_STATES.filter(s => s.status === 'progress').length} in progress · ${MOCK_STATES.filter(s => s.status === 'expiring').length} expiring soon · 50 states + DC`}
          href="/licensing"
          ctaLabel="View licensing"
          headRight={
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
              {imlcCount} IMLC-eligible
            </span>
          }
        >
          <TileMap states={MOCK_STATES} />

          {/* Legend */}
          <div className="legend">
            {([
              ['var(--ok)',           'Active'],
              ['var(--info)',         'In progress'],
              ['var(--warn)',         'Expiring ≤90d'],
              ['var(--border-strong)','Not licensed'],
            ] as [string, string][]).map(([color, label]) => (
              <span key={label} className="legend-item">
                <span className="legend-sw" style={{ background: color }} />
                {label}
              </span>
            ))}
            <span className="legend-item" style={{ marginLeft: 'auto' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
              &nbsp;IMLC-eligible
            </span>
          </div>
        </Card>
      </div>

      {/* ── 3. Credentialing ── */}
      <CredentialingTable payers={MOCK_PAYERS} />

      {/* ── 4. Finances ── */}
      <div className="col-7">
        <Card
          title="Finances"
          desc="Revenue vs. expenses · last 6 months"
          href="/finances"
          ctaLabel="View finances"
          headRight={
            <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--ink-2)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--primary)', display: 'inline-block' }} />
                Revenue
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: 'color-mix(in srgb,var(--primary) 28%,var(--border-strong))', display: 'inline-block' }} />
                Expenses
              </span>
            </div>
          }
        >
          <BarChart months={MOCK_FINANCES.months} />
          <ExpenseBreakdown categories={MOCK_FINANCES.expenseCategories} />
        </Card>
      </div>

      {/* ── 5. Active engagements ── */}
      <ActiveEngagements engagements={MOCK_ENGAGEMENTS} />

      {/* ── 6. Compliance checklist ── */}
      <ComplianceChecklist checklist={MOCK_CHECKLIST} />

    </div>
  );
}
