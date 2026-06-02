'use client';

import { ShieldCheck, Briefcase, DollarSign, ShieldAlert } from 'lucide-react';
import { KpiStat } from '@/components/ui/KpiStat';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { TileMap } from '@/components/overview/TileMap';
import { BarChart } from '@/components/overview/BarChart';
import { ExpenseBreakdown } from '@/components/overview/ExpenseBreakdown';
import { CredentialingTable } from '@/components/overview/CredentialingTable';
import { ActiveEngagements } from '@/components/overview/ActiveEngagements';
import { ComplianceChecklist } from '@/components/overview/ComplianceChecklist';
import { useLicenses } from '@/hooks/use-licenses';
import { usePayers } from '@/hooks/use-payers';
import { useEngagements } from '@/hooks/use-engagements';
import { useFinances } from '@/hooks/use-finances';
import { useChecklist } from '@/hooks/use-checklist';
import { finMonths, finExpenseByCategory, fmtUSD } from '@/lib/finance-helpers';
import type { LucideIcon } from 'lucide-react';
import type { MockState, MockPayer, MockEngagement, MockCheckItem } from '@/lib/mock-data';

const KPI_ICONS: Record<string, LucideIcon> = {
  licenses:    ShieldCheck,
  engagements: Briefcase,
  revenue:     DollarSign,
  tasks:       ShieldAlert,
};

const SECTION_HREFS: Record<string, string> = {
  licensing:   '/licensing',
  engagements: '/engagements',
  finances:    '/finances',
  compliance:  '/compliance',
};

export default function OverviewPage() {
  const { data: licenses = [],    isLoading: l1 } = useLicenses();
  const { data: payers   = [],    isLoading: l2 } = usePayers();
  const { data: engagements = [], isLoading: l3 } = useEngagements();
  const { data: finances,         isLoading: l4 } = useFinances();
  const { data: checklist = [],   isLoading: l5 } = useChecklist();

  if (l1 || l2 || l3 || l4 || l5) return <LoadingState />;

  // Derive KPI values from live data
  const activeCount   = licenses.filter(s => s.status === 'active').length;
  const progressCount = licenses.filter(s => s.status === 'progress').length;
  const expiringCount = licenses.filter(s => s.status === 'expiring').length;
  const imlcCount     = licenses.filter((s: any) => s.imlc).length;

  const activeEng = engagements.filter(e => e.status === 'active').length;
  const holdEng   = engagements.filter(e => e.status === 'hold').length;

  const openTasks = checklist.filter(c => c.status !== 'done').length;

  const months     = finances ? finMonths(finances) : [];
  const cats       = finances ? finExpenseByCategory(finances) : [];
  const curMonth   = months[months.length - 1];
  const prevMonth  = months[months.length - 2];
  const mtdRev     = curMonth?.rev ?? 0;
  const prevRev    = prevMonth?.rev ?? 0;
  const revDiff    = prevRev > 0 ? Math.round(((mtdRev - prevRev) / prevRev) * 100) : 0;

  const kpis = [
    { id: 'licenses',    label: 'Active state licenses',  value: activeCount,      sub: `${progressCount} in progress`,  trend: 'up'  as const, trendLabel: `${activeCount} active`,         section: 'licensing' },
    { id: 'engagements', label: 'Active engagements',     value: activeEng,        sub: holdEng ? `${holdEng} on hold` : 'all active', trend: 'flat' as const, trendLabel: 'no change',   section: 'engagements' },
    { id: 'revenue',     label: 'MTD revenue',            value: fmtUSD(mtdRev),   sub: prevRev ? `vs ${fmtUSD(prevRev)} last mo.` : 'this month', trend: revDiff >= 0 ? 'up' as const : 'down' as const, trendLabel: `${revDiff >= 0 ? '+' : ''}${revDiff}% MoM`, section: 'finances' },
    { id: 'tasks',       label: 'Outstanding tasks',      value: openTasks,        sub: `${checklist.filter(c => c.status === 'progress').length} in progress`, trend: 'flat' as const, trendLabel: 'this month', section: 'compliance' },
  ];

  // Cast to the expected prop types
  const statesForMap = licenses as unknown as MockState[];
  const payersForTable = payers as unknown as MockPayer[];
  const engsForCard = engagements as unknown as MockEngagement[];
  const checkForCard = checklist as unknown as MockCheckItem[];

  return (
    <div className="dash-grid">

      {/* ── 1. KPI row ── */}
      {kpis.map((kpi) => (
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

      {/* ── 2. Licensing tile map ── */}
      <div className="col-7">
        <Card
          title="Multi-state licensing"
          desc={`${activeCount} active · ${progressCount} in progress · ${expiringCount} expiring soon`}
          href="/licensing"
          ctaLabel="View licensing"
          headRight={
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
              {imlcCount} IMLC-eligible
            </span>
          }
        >
          <TileMap states={statesForMap} />
          <div className="legend">
            {([
              ['var(--ok)',            'Active'],
              ['var(--info)',          'In progress'],
              ['var(--warn)',          'Expiring ≤90d'],
              ['var(--border-strong)', 'Not licensed'],
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
      <CredentialingTable payers={payersForTable} />

      {/* ── 4. Finances ── */}
      {finances && (
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
            <BarChart months={months} />
            <ExpenseBreakdown categories={cats} />
          </Card>
        </div>
      )}

      {/* ── 5. Active engagements ── */}
      <ActiveEngagements engagements={engsForCard} />

      {/* ── 6. Compliance checklist ── */}
      <ComplianceChecklist checklist={checkForCard} />

    </div>
  );
}
