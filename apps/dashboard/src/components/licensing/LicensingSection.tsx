'use client';

import { useState } from 'react';
import { Search, Plus, Calendar } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { StatusPill, STATE_STATUS } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { TileMap } from '@/components/overview/TileMap';
import { LicenseDrawer } from './LicenseDrawer';
import { daysUntil, fmtDays, fmtDate } from '@/lib/date-helpers';
import { emitAudit } from '@/lib/audit';
import { LICENSE_STATUS_OPTS } from '@/lib/types';
import type { LicenseRecord } from '@/lib/types';
import type { MockState } from '@/lib/mock-data';

interface LicensingSectionProps {
  initialLicenses: LicenseRecord[];
}

// DrawerState drives which drawer is open and with what context.
type DrawerState =
  | { kind: 'closed' }
  | { kind: 'edit'; code: string }
  | { kind: 'new'; prefillCode?: string };

export function LicensingSection({ initialLicenses }: LicensingSectionProps) {
  const [licenses, setLicenses] = useState<LicenseRecord[]>(initialLicenses);
  const [drawer, setDrawer] = useState<DrawerState>({ kind: 'closed' });
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  // Counts per status for the stat filter cards
  const counts = licenses.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});
  const imlcCount = licenses.filter(s => s.imlc).length;

  // Upcoming renewals: real ISO expiry dates, soonest first
  const renewals = licenses
    .filter(s => s.expires && s.expires.includes('-'))
    .map(s => ({ ...s, d: daysUntil(s.expires) ?? Infinity }))
    .sort((a, b) => a.d - b.d);

  const q = query.trim().toLowerCase();
  const filteredRenewals = renewals.filter(s =>
    (!filter || s.status === filter) &&
    (!q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)),
  );

  // Drawer actions
  const openState = (code: string) => {
    if (licenses.some(s => s.code === code)) {
      setDrawer({ kind: 'edit', code });
    } else {
      setDrawer({ kind: 'new', prefillCode: code });
    }
  };
  const closeDrawer = () => setDrawer({ kind: 'closed' });

  const saveLicense = (record: LicenseRecord) => {
    const isCreating = !licenses.some(s => s.code === record.code);
    setLicenses(prev => {
      const i = prev.findIndex(s => s.code === record.code);
      if (i === -1) return [...prev, record];
      const next = [...prev];
      next[i] = record;
      return next;
    });
    emitAudit({
      action: isCreating ? 'create' : 'update',
      entity: 'license',
      entityId: record.code,
      label: `License ${record.code} (${record.name}) ${isCreating ? 'added' : 'saved'}`,
      tenantId: 'demo',
    });
    setDrawer({ kind: 'edit', code: record.code });
  };

  const deleteLicense = (code: string) => {
    const record = licenses.find(s => s.code === code);
    emitAudit({
      action: 'delete',
      entity: 'license',
      entityId: code,
      label: `License ${code}${record ? ` (${record.name})` : ''} deleted`,
      tenantId: 'demo',
    });
    setLicenses(prev => prev.filter(s => s.code !== code));
    closeDrawer();
  };

  // Resolve which record to pass to the drawer
  const editingRecord =
    drawer.kind === 'edit'
      ? licenses.find(s => s.code === drawer.code) ?? null
      : null;

  // TileMap needs MockState shape
  const statesForMap: MockState[] = licenses.map(l => ({
    code: l.code, name: l.name, status: l.status,
    date: l.date, imlc: l.imlc, home: l.home,
  }));

  return (
    <div>
      <SectionHeader
        title="Licensing"
        desc="State medical licenses, renewal dates, and a living reference doc of renewal requirements per state."
        actions={
          <div className="lic-toolbar">
            <div className="lic-search">
              <Search size={15} />
              <input
                placeholder="Find a state…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-label="Search states"
              />
            </div>
            <button
              type="button"
              className="btn primary"
              onClick={() => setDrawer({ kind: 'new' })}
            >
              <Plus size={15} /> Add state
            </button>
          </div>
        }
      />

      {/* ── Stat filter cards ── */}
      <div className="dash-grid" style={{ marginBottom: 'var(--gap-grid)' }}>
        {LICENSE_STATUS_OPTS.map(([key, label, cls]) => {
          const isSelected = filter === key;
          const s = STATE_STATUS[key]!;
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

      {/* ── Main grid ── */}
      <div className="dash-grid">

        {/* Footprint tile map */}
        <div className="col-7">
          <Card
            title="Footprint"
            desc="Click any state to open its reference doc · grey = not licensed"
            headRight={
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                {imlcCount} IMLC-eligible
              </span>
            }
          >
            <TileMap states={statesForMap} onSelect={openState} />
            <div className="legend">
              {([
                ['var(--ok)',            'Active'],
                ['var(--info)',          'In progress'],
                ['var(--warn)',          'Expiring ≤90d'],
                ['var(--border-strong)', 'Not licensed'],
              ] as [string, string][]).map(([color, lbl]) => (
                <span key={lbl} className="legend-item">
                  <span className="legend-sw" style={{ background: color }} />
                  {lbl}
                </span>
              ))}
              <span className="legend-item" style={{ marginLeft: 'auto' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
                &nbsp;IMLC-eligible
              </span>
            </div>
          </Card>
        </div>

        {/* Upcoming renewals */}
        <div className="col-5">
          <Card
            title="Upcoming renewals"
            desc={filter
              ? `Filtered: ${LICENSE_STATUS_OPTS.find(o => o[0] === filter)?.[1] ?? ''}`
              : 'Soonest first'}
          >
            {filteredRenewals.length === 0 ? (
              <EmptyState
                Icon={Calendar}
                title="No matching renewals"
                desc="Active licenses with a renewal date will appear here, ordered by what's due next."
              />
            ) : filteredRenewals.map(s => {
              const badgeCls = s.d < 30 ? 'bad' : s.d < 90 ? 'warn' : '';
              return (
                <div
                  key={s.code}
                  className="renew-row"
                  onClick={() => openState(s.code)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && openState(s.code)}
                >
                  <span className="renew-code">{s.code}</span>
                  <div>
                    <div className="renew-name">{s.name}</div>
                    <div className="renew-sub mono">renews {fmtDate(s.expires)}</div>
                  </div>
                  <span className={`days-badge ${badgeCls}`}>{fmtDays(s.d)}</span>
                </div>
              );
            })}
          </Card>
        </div>

      </div>

      {/* ── Drawer ── */}
      {drawer.kind !== 'closed' && (
        <LicenseDrawer
          key={drawer.kind === 'edit' ? drawer.code : '__new__'}
          license={editingRecord}
          prefillCode={drawer.kind === 'new' ? drawer.prefillCode : undefined}
          existingCodes={licenses.map(s => s.code)}
          onSave={saveLicense}
          onDelete={deleteLicense}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
}
