'use client';

import { useState } from 'react';
import { Search, Plus, Check, ShieldAlert } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { StatusPill, CHK_STATUS } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { TaskDrawer } from './TaskDrawer';
import { daysUntil, fmtDate } from '@/lib/date-helpers';
import { CHK_STATUS_OPTS, CHK_SORT_ORDER } from '@/lib/types';
import type { ChecklistTask } from '@/lib/types';

interface ComplianceSectionProps {
  initialTasks: ChecklistTask[];
}

type DrawerState =
  | { kind: 'closed' }
  | { kind: 'edit'; id: string }
  | { kind: 'new' };

export function ComplianceSection({ initialTasks }: ComplianceSectionProps) {
  const [tasks, setTasks] = useState<ChecklistTask[]>(initialTasks);
  const [drawer, setDrawer] = useState<DrawerState>({ kind: 'closed' });
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  // ── Counts & readiness ────────────────────────────────────────────────────
  const counts = tasks.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});
  const done = counts['done'] ?? 0;
  const pct  = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  // ── Filtering + sorting ───────────────────────────────────────────────────
  const q = query.trim().toLowerCase();
  const filtered = tasks
    .filter(c =>
      (!filter || c.status === filter) &&
      (!q || c.task.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)),
    )
    .sort((a, b) => {
      const statusDiff = (CHK_SORT_ORDER[a.status] ?? 9) - (CHK_SORT_ORDER[b.status] ?? 9);
      if (statusDiff !== 0) return statusDiff;
      // Within same status, sort by due date ascending (null last)
      const da = daysUntil(a.date) ?? Infinity;
      const db = daysUntil(b.date) ?? Infinity;
      return da - db;
    });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const closeDrawer = () => setDrawer({ kind: 'closed' });

  const saveTask = (task: ChecklistTask) => {
    setTasks(prev => {
      const i = prev.findIndex(c => c.id === task.id);
      if (i === -1) return [...prev, task];
      const next = [...prev];
      next[i] = task;
      return next;
    });
    setDrawer({ kind: 'edit', id: task.id });
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(c => c.id !== id));
    closeDrawer();
  };

  // Quick-toggle: flip done ↔ notstarted without opening the drawer.
  // e.stopPropagation() keeps the row click from also firing.
  const quickToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, status: c.status === 'done' ? 'notstarted' : 'done' }
          : c,
      ),
    );
  };

  const editingTask =
    drawer.kind === 'edit'
      ? tasks.find(c => c.id === drawer.id) ?? null
      : null;

  return (
    <div>
      <SectionHeader
        title="Compliance & setup"
        desc="Entity, banking, HIPAA, and insurance readiness — each task with its own checklist of sub-steps and documents."
        actions={
          <div className="lic-toolbar">
            <div className="lic-search">
              <Search size={15} />
              <input
                placeholder="Find a task…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-label="Search tasks"
              />
            </div>
            <button
              type="button"
              className="btn primary"
              onClick={() => setDrawer({ kind: 'new' })}
            >
              <Plus size={15} /> Add task
            </button>
          </div>
        }
      />

      {/* ── KPI row: Readiness card + 3 stat filter cards ── */}
      <div className="dash-grid" style={{ marginBottom: 'var(--gap-grid)' }}>

        {/* Readiness — not a filter, just a live metric */}
        <div className="col-3">
          <div className="card kpi">
            <span className="kpi-label">Readiness</span>
            <div className="kpi-value" style={{ margin: '10px 0 8px' }}>{pct}%</div>
            <div className="progress">
              <span style={{ width: `${pct}%` }} />
            </div>
            <div className="kpi-sub" style={{ marginTop: 7 }}>
              {done} of {tasks.length} complete
            </div>
          </div>
        </div>

        {/* Status filter cards */}
        {CHK_STATUS_OPTS.map(([key, label]) => {
          const isSelected = filter === key;
          const s = CHK_STATUS[key]!;
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

      {/* ── Tasks list ── */}
      <div className="dash-grid">
        <div className="col-12">
          <Card
            title="Tasks"
            desc={
              filter
                ? `Filtered: ${CHK_STATUS_OPTS.find(o => o[0] === filter)?.[1] ?? ''}`
                : 'Tick the box to complete · click a row to open its checklist'
            }
          >
            {filtered.length === 0 ? (
              <EmptyState
                Icon={ShieldAlert}
                title="No matching tasks"
                desc="Add setup and compliance tasks — entity, banking, HIPAA, insurance."
              />
            ) : (
              <div className="check-list">
                {filtered.map(c => {
                  const dUntil = daysUntil(c.date);
                  const soon   = dUntil != null && dUntil <= 14 && c.status !== 'done';
                  const subDone = c.requirements.filter(r => r.done).length;
                  const sInfo  = CHK_STATUS[c.status] ?? CHK_STATUS['notstarted']!;

                  return (
                    <div
                      key={c.id}
                      className="check-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setDrawer({ kind: 'edit', id: c.id })}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setDrawer({ kind: 'edit', id: c.id })}
                    >
                      {/* Quick-toggle checkbox */}
                      <span
                        className={`check-box ${c.status}`}
                        onClick={e => quickToggle(c.id, e)}
                        role="checkbox"
                        aria-checked={c.status === 'done'}
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            setTasks(prev =>
                              prev.map(t =>
                                t.id === c.id
                                  ? { ...t, status: t.status === 'done' ? 'notstarted' : 'done' }
                                  : t,
                              ),
                            );
                          }
                        }}
                        title="Toggle complete"
                      >
                        {c.status === 'done'     && <Check size={13} />}
                        {c.status === 'progress' && <span style={{ fontSize: 11, fontWeight: 700 }}>·</span>}
                      </span>

                      {/* Task name + sub-step count */}
                      <div style={{ flex: 1 }}>
                        <span className={`check-task${c.status === 'done' ? ' done' : ''}`}>
                          {c.task}
                        </span>
                        {c.requirements.length > 0 && (
                          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                            {subDone}/{c.requirements.length} sub-steps
                          </div>
                        )}
                      </div>

                      {/* Meta: group tag + due date + status pill */}
                      <span className="check-meta">
                        <span className="tag">{c.group}</span>
                        {c.status !== 'done' && c.date && (
                          <span className={`check-due${soon ? ' soon' : ''}`}>
                            due {fmtDate(c.date)}
                          </span>
                        )}
                        <StatusPill variant={sInfo.variant} label={sInfo.label} />
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Drawer ── */}
      {drawer.kind !== 'closed' && (
        <TaskDrawer
          key={drawer.kind === 'edit' ? drawer.id : '__new__'}
          task={editingTask}
          onSave={saveTask}
          onDelete={deleteTask}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
}
