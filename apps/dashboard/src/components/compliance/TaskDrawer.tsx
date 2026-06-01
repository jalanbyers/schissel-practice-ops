'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Check, FileText } from 'lucide-react';
import { StatusPill, CHK_STATUS } from '@/components/ui/StatusPill';
import { uid, daysUntil, fmtDays } from '@/lib/date-helpers';
import { CHK_STATUS_OPTS, CHK_GROUPS } from '@/lib/types';
import type { ChecklistTask, Requirement, LicenseDoc } from '@/lib/types';

interface TaskDrawerProps {
  task: ChecklistTask | null;
  onSave: (task: ChecklistTask) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function blank(): ChecklistTask {
  return {
    id: uid(), task: '', group: 'General', status: 'notstarted',
    date: null, owner: '', requirements: [], documents: [], notes: '',
  };
}

export function TaskDrawer({ task, onSave, onDelete, onClose }: TaskDrawerProps) {
  const isNew = task === null;
  const [draft, setDraft] = useState<ChecklistTask>(() =>
    task ? structuredClone(task) : blank(),
  );

  const set = useCallback(<K extends keyof ChecklistTask>(key: K, value: ChecklistTask[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Sub-steps (requirements)
  const addReq = () => set('requirements', [...draft.requirements, { id: uid(), label: '', done: false }]);
  const updReq = (id: string, patch: Partial<Requirement>) =>
    set('requirements', draft.requirements.map(r => r.id === id ? { ...r, ...patch } : r));
  const delReq = (id: string) =>
    set('requirements', draft.requirements.filter(r => r.id !== id));

  // Documents
  const addDoc = () => set('documents', [...draft.documents, { id: uid(), name: '', note: '' }]);
  const updDoc = (id: string, patch: Partial<LicenseDoc>) =>
    set('documents', draft.documents.map(x => x.id === id ? { ...x, ...patch } : x));
  const delDoc = (id: string) =>
    set('documents', draft.documents.filter(x => x.id !== id));

  const reqDone = draft.requirements.filter(r => r.done).length;
  const canSave = !!draft.task.trim();
  const dUntil  = daysUntil(draft.date);
  const statusInfo = CHK_STATUS[draft.status] ?? CHK_STATUS['notstarted']!;

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />

      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Task details">

        {/* ── Head ── */}
        <header className="drawer-head">
          <div style={{ flex: 1 }}>
            <div className="drawer-eyebrow">{isNew ? 'Add compliance task' : 'Compliance task'}</div>
            <div className="drawer-title">
              <span style={{ fontSize: 18 }}>{draft.task || 'New task'}</span>
            </div>
            <div className="drawer-badges">
              <StatusPill variant={statusInfo.variant} label={statusInfo.label} />
              <span className="mini-badge">{draft.group}</span>
              {dUntil != null && draft.status !== 'done' && (
                <span className="mini-badge">{fmtDays(dUntil)}</span>
              )}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close drawer" style={{ flex: 'none' }}>
            <X size={18} />
          </button>
        </header>

        {/* ── Body ── */}
        <div className="drawer-body">

          {/* Status */}
          <div className="dgroup">
            <div className="dgroup-head"><span className="dgroup-title">Status</span></div>
            <div className="seg-status">
              {CHK_STATUS_OPTS.map(([key, label, cls]) => (
                <button
                  key={key}
                  type="button"
                  className={draft.status === key ? `on ${cls}` : ''}
                  onClick={() => set('status', key as ChecklistTask['status'])}
                >
                  <span className="dot" style={{ background: `var(--${cls})` }} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Key facts */}
          <div className="dgroup">
            <div className="dgroup-head"><span className="dgroup-title">Key facts</span></div>
            <div className="field-grid">
              <div className="field full">
                <label htmlFor="task-name">Task</label>
                <input id="task-name" className="input" value={draft.task}
                  placeholder="e.g. HIPAA security risk assessment"
                  onChange={e => set('task', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="task-group">Category</label>
                <select id="task-group" className="input" value={draft.group}
                  onChange={e => set('group', e.target.value as ChecklistTask['group'])}>
                  {CHK_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="task-due">Due date</label>
                <input id="task-due" className="input" type="date"
                  value={draft.date ?? ''}
                  onChange={e => set('date', e.target.value || null)} />
              </div>
              <div className="field full">
                <label htmlFor="task-owner">Owner</label>
                <input id="task-owner" className="input" value={draft.owner}
                  placeholder="who's responsible"
                  onChange={e => set('owner', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Sub-steps */}
          <div className="dgroup">
            <div className="dgroup-head">
              <span className="dgroup-title">Sub-steps</span>
              <span className="dgroup-meta">{reqDone}/{draft.requirements.length} done</span>
              <button type="button" className="btn ghost" onClick={addReq}>
                <Plus size={13} /> Add
              </button>
            </div>
            {draft.requirements.length === 0 && (
              <div className="empty-mini">Break the task into checkable sub-steps…</div>
            )}
            {draft.requirements.map(r => (
              <div key={r.id} className="req-item">
                <span
                  className={`req-check${r.done ? ' done' : ''}`}
                  role="checkbox"
                  aria-checked={r.done}
                  tabIndex={0}
                  onClick={() => updReq(r.id, { done: !r.done })}
                  onKeyDown={e => e.key === 'Enter' && updReq(r.id, { done: !r.done })}
                >
                  {r.done && <Check size={13} />}
                </span>
                <input
                  className={`req-input${r.done ? ' done' : ''}`}
                  value={r.label}
                  placeholder="Describe a sub-step…"
                  onChange={e => updReq(r.id, { label: e.target.value })}
                />
                <button type="button" className="row-del" title="Remove" onClick={() => delReq(r.id)}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Reference documents */}
          <div className="dgroup">
            <div className="dgroup-head">
              <span className="dgroup-title">Reference documents</span>
              <button type="button" className="btn ghost" onClick={addDoc}>
                <Plus size={13} /> Add
              </button>
            </div>
            {draft.documents.length === 0 && (
              <div className="empty-mini">Link policies, signed forms, confirmations…</div>
            )}
            {draft.documents.map(x => (
              <div key={x.id} className="doc-item">
                <span className="doc-ico"><FileText size={16} /></span>
                <div className="doc-main">
                  <input className="doc-name" value={x.name}
                    placeholder="Document name"
                    onChange={e => updDoc(x.id, { name: e.target.value })} />
                  <input className="doc-note" value={x.note}
                    placeholder="Link or where it lives…"
                    onChange={e => updDoc(x.id, { note: e.target.value })} />
                </div>
                <button type="button" className="row-del" title="Remove" onClick={() => delDoc(x.id)}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="dgroup">
            <div className="dgroup-head"><span className="dgroup-title">Notes</span></div>
            <textarea
              className="textarea"
              value={draft.notes}
              placeholder="Context, deadlines, who to contact, renewal cadence…"
              onChange={e => set('notes', e.target.value)}
            />
          </div>

        </div>

        {/* ── Foot ── */}
        <footer className="drawer-foot">
          {!isNew && (
            <button type="button" className="btn danger" onClick={() => onDelete(draft.id)}>
              Delete
            </button>
          )}
          <div className="spacer" />
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn primary"
            disabled={!canSave}
            style={!canSave ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => canSave && onSave(draft)}
          >
            {isNew ? 'Add task' : 'Save changes'}
          </button>
        </footer>

      </aside>
    </>
  );
}
