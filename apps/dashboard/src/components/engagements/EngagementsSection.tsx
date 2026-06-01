'use client';

import { useState } from 'react';
import { Search, Plus, Briefcase } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { StatusPill, ENG_STATUS } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { EngagementDrawer } from './EngagementDrawer';
import { ENG_STATUS_OPTS, ENG_SORT_ORDER } from '@/lib/types';
import { emitAudit } from '@/lib/audit';
import type { EngagementRecord } from '@/lib/types';

interface EngagementsSectionProps {
  initialEngagements: EngagementRecord[];
}

type DrawerState =
  | { kind: 'closed' }
  | { kind: 'edit'; id: string }
  | { kind: 'new' };

export function EngagementsSection({ initialEngagements }: EngagementsSectionProps) {
  const [engagements, setEngagements] = useState<EngagementRecord[]>(initialEngagements);
  const [drawer, setDrawer] = useState<DrawerState>({ kind: 'closed' });
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  const counts = engagements.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});

  const q = query.trim().toLowerCase();
  const filtered = engagements
    .filter(e =>
      (!filter || e.status === filter) &&
      (!q || e.name.toLowerCase().includes(q) || e.model.toLowerCase().includes(q)),
    )
    .sort((a, b) => (ENG_SORT_ORDER[a.status] ?? 9) - (ENG_SORT_ORDER[b.status] ?? 9));

  const closeDrawer = () => setDrawer({ kind: 'closed' });

  const saveEngagement = (record: EngagementRecord) => {
    const isCreating = !engagements.some(e => e.id === record.id);
    setEngagements(prev => {
      const i = prev.findIndex(e => e.id === record.id);
      if (i === -1) return [...prev, record];
      const next = [...prev];
      next[i] = record;
      return next;
    });
    emitAudit({
      action: isCreating ? 'create' : 'update',
      entity: 'engagement',
      entityId: record.id,
      label: `Engagement "${record.name}" ${isCreating ? 'added' : 'saved'}`,
      tenantId: 'demo',
    });
    setDrawer({ kind: 'edit', id: record.id });
  };

  const deleteEngagement = (id: string) => {
    const record = engagements.find(e => e.id === id);
    emitAudit({
      action: 'delete',
      entity: 'engagement',
      entityId: id,
      label: `Engagement "${record?.name ?? id}" deleted`,
      tenantId: 'demo',
    });
    setEngagements(prev => prev.filter(e => e.id !== id));
    closeDrawer();
  };

  const editingEngagement =
    drawer.kind === 'edit'
      ? engagements.find(e => e.id === drawer.id) ?? null
      : null;

  return (
    <div>
      <SectionHeader
        title="Engagements"
        desc="1099 contracts and telehealth platforms — volume, rate, status, and a living reference doc per engagement."
        actions={
          <div className="lic-toolbar">
            <div className="lic-search">
              <Search size={15} />
              <input
                placeholder="Find an engagement…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-label="Search engagements"
              />
            </div>
            <button
              type="button"
              className="btn primary"
              onClick={() => setDrawer({ kind: 'new' })}
            >
              <Plus size={15} /> Add engagement
            </button>
          </div>
        }
      />

      {/* ── Stat filter cards ── */}
      <div className="dash-grid" style={{ marginBottom: 'var(--gap-grid)' }}>
        {ENG_STATUS_OPTS.map(([key, label]) => {
          const isSelected = filter === key;
          const s = ENG_STATUS[key]!;
          return (
            <div key={key} className="col-3">
              <div
                className={`card kpi stat-card${isSelected ? ' sel' : ''}`}
                onClick={() => setFilter(isSelected ? null : key)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setFilter(isSelected ? null : key)}
                aria-pressed={isSelected}
              >
                <div className="stat-mini">
                  <StatusPill variant={s.variant} label={label} />
                </div>
                <div className="kpi-value" style={{ margin: '10px 0 2px' }}>
                  {counts[key] ?? 0}
                </div>
                <div className="kpi-sub">
                  {isSelected ? 'Filtering · tap to clear' : 'tap to filter'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Roster table ── */}
      <div className="dash-grid">
        <div className="col-12">
          <Card
            title="Roster"
            desc={
              filter
                ? `Filtered: ${ENG_STATUS_OPTS.find(o => o[0] === filter)?.[1] ?? ''}`
                : 'Click any engagement to open its reference doc · active first'
            }
          >
            {filtered.length === 0 ? (
              <EmptyState
                Icon={Briefcase}
                title="No matching engagements"
                desc="Add 1099 contracts and telehealth platforms to track volume, rate, and onboarding."
              />
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Engagement</th>
                    <th>Model</th>
                    <th>Volume</th>
                    <th>Rate</th>
                    <th>Onboarding</th>
                    <th style={{ textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => {
                    const done = e.requirements.filter(r => r.done).length;
                    const s = ENG_STATUS[e.status] ?? ENG_STATUS['ended']!;
                    return (
                      <tr
                        key={e.id}
                        className="row"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setDrawer({ kind: 'edit', id: e.id })}
                      >
                        <td className="name">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <span
                              className="eng-logo"
                              style={{ width: 30, height: 30, fontSize: 12, borderRadius: 7 }}
                            >
                              {e.name.slice(0, 2).toUpperCase()}
                            </span>
                            {e.name}
                          </div>
                        </td>
                        <td>{e.model || '—'}</td>
                        <td className="mono">{e.volume || '—'}</td>
                        <td className="mono">{e.rate || '—'}</td>
                        <td className="mono" style={{ color: 'var(--ink-3)', fontSize: 12 }}>
                          {e.requirements.length ? `${done}/${e.requirements.length}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <StatusPill variant={s.variant} label={s.label} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      </div>

      {/* ── Drawer ── */}
      {drawer.kind !== 'closed' && (
        <EngagementDrawer
          key={drawer.kind === 'edit' ? drawer.id : '__new__'}
          engagement={editingEngagement}
          onSave={saveEngagement}
          onDelete={deleteEngagement}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
}
