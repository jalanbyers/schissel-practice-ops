'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Plus, ClipboardCheck } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { StatusPill, PAYER_STATUS } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { PayerDrawer } from './PayerDrawer';
import { fmtDate } from '@/lib/date-helpers';
import { PAYER_STATUS_OPTS, PAYER_SORT_ORDER } from '@/lib/types';
import type { PayerRecord } from '@/lib/types';
import { clientFetch } from '@/lib/client-fetch';
import { emitAudit } from '@/lib/audit';
import { usePayers, PAYERS_KEY } from '@/hooks/use-payers';

type DrawerState = { kind: 'closed' } | { kind: 'edit'; id: string } | { kind: 'new' };

export function CredentialingSection() {
  const queryClient = useQueryClient();
  const { data: payers = [], isLoading, isError } = usePayers();
  const [drawer, setDrawer] = useState<DrawerState>({ kind: 'closed' });
  const [query, setQuery]   = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  const counts = payers.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  const q = query.trim().toLowerCase();
  const filtered = payers
    .filter(p => (!filter || p.status === filter) &&
      (!q || p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q)))
    .sort((a, b) => (PAYER_SORT_ORDER[a.status] ?? 9) - (PAYER_SORT_ORDER[b.status] ?? 9));

  const closeDrawer = () => setDrawer({ kind: 'closed' });

  const savePayer = async (record: PayerRecord) => {
    const isCreating = !payers.some(p => p.id === record.id);
    await clientFetch(
      isCreating ? '/payers' : `/payers/${record.id}`,
      { method: isCreating ? 'POST' : 'PATCH', body: JSON.stringify(record) },
    );
    emitAudit({
      action: isCreating ? 'create' : 'update', entity: 'payer',
      entityId: record.id,
      label: `Payer "${record.name}" ${isCreating ? 'added' : 'saved'}`,
      tenantId: 'session',
    });
    await queryClient.invalidateQueries({ queryKey: PAYERS_KEY });
    setDrawer({ kind: 'edit', id: record.id });
  };

  const deletePayer = async (id: string) => {
    const record = payers.find(p => p.id === id);
    await clientFetch(`/payers/${id}`, { method: 'DELETE' });
    emitAudit({
      action: 'delete', entity: 'payer', entityId: id,
      label: `Payer "${record?.name ?? id}" deleted`,
      tenantId: 'session',
    });
    await queryClient.invalidateQueries({ queryKey: PAYERS_KEY });
    closeDrawer();
  };

  const editingPayer = drawer.kind === 'edit'
    ? payers.find(p => p.id === drawer.id) ?? null : null;

  if (isLoading) return <LoadingState />;
  if (isError)   return <LoadingState error message="Could not load payer enrollments." />;

  return (
    <div>
      <SectionHeader
        title="Credentialing & payer enrollment"
        desc="Government, commercial, and platform enrollments — each with a living reference doc of requirements and IDs."
        actions={
          <div className="lic-toolbar">
            <div className="lic-search">
              <Search size={15} />
              <input placeholder="Find a payer…" value={query}
                onChange={e => setQuery(e.target.value)} aria-label="Search payers" />
            </div>
            <button type="button" className="btn primary"
              onClick={() => setDrawer({ kind: 'new' })}>
              <Plus size={15} /> Add payer
            </button>
          </div>
        }
      />

      <div className="dash-grid" style={{ marginBottom: 'var(--gap-grid)' }}>
        {PAYER_STATUS_OPTS.map(([key, label]) => {
          const isSelected = filter === key;
          const s = PAYER_STATUS[key]!;
          return (
            <div key={key} className="col-3">
              <div className={`card kpi stat-card${isSelected ? ' sel' : ''}`}
                onClick={() => setFilter(isSelected ? null : key)}
                role="button" tabIndex={0} aria-pressed={isSelected}
                onKeyDown={e => e.key === 'Enter' && setFilter(isSelected ? null : key)}>
                <div className="stat-mini"><StatusPill variant={s.variant} label={label} /></div>
                <div className="kpi-value" style={{ margin: '10px 0 2px' }}>{counts[key] ?? 0}</div>
                <div className="kpi-sub">{isSelected ? 'Filtering · tap to clear' : 'tap to filter'}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dash-grid">
        <div className="col-12">
          <Card title="Enrollments"
            desc={filter ? `Filtered: ${PAYER_STATUS_OPTS.find(o=>o[0]===filter)?.[1]??''}` : 'Click any payer to open its reference doc · in-review first'}>
            {filtered.length === 0 ? (
              <EmptyState Icon={ClipboardCheck} title="No matching payers"
                desc="Add payers and platforms to track enrollment from submission through approval." />
            ) : (
              <table className="tbl">
                <thead><tr><th>Payer / platform</th><th>Type</th><th>Requirements</th><th>Status</th><th style={{ textAlign:'right' }}>Updated</th></tr></thead>
                <tbody>
                  {filtered.map(p => {
                    const done = p.requirements.filter(r => r.done).length;
                    const s = PAYER_STATUS[p.status] ?? PAYER_STATUS['notstarted']!;
                    return (
                      <tr key={p.id} className="row" style={{ cursor:'pointer' }}
                        onClick={() => setDrawer({ kind:'edit', id:p.id })}>
                        <td className="name">{p.name}</td>
                        <td><span className="tag">{p.type}</span></td>
                        <td className="mono" style={{ color:'var(--ink-3)',fontSize:12 }}>
                          {p.requirements.length ? `${done}/${p.requirements.length} done` : '—'}
                        </td>
                        <td><StatusPill variant={s.variant} label={s.label} /></td>
                        <td className="num" style={{ color:'var(--ink-3)' }}>{p.date ? fmtDate(p.date) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      </div>

      {drawer.kind !== 'closed' && (
        <PayerDrawer key={drawer.kind === 'edit' ? drawer.id : '__new__'}
          payer={editingPayer} onSave={savePayer} onDelete={deletePayer} onClose={closeDrawer} />
      )}
    </div>
  );
}
