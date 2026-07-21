'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Check, FileText } from 'lucide-react';
import { StatusPill, STATE_STATUS } from '@/components/ui/StatusPill';
import { US_GRID, US_NAMES } from '@/lib/us-grid';
import { daysUntil, fmtDays, uid } from '@/lib/date-helpers';
import { LICENSE_STATUS_OPTS, RENEWAL_CYCLES } from '@/lib/types';
import type { LicenseRecord, Requirement, LicenseDoc } from '@/lib/types';

interface LicenseDrawerProps {
  license: LicenseRecord | null;   // null → "add new" mode
  existingCodes: string[];
  prefillCode?: string;            // pre-select this code in add mode
  onSave: (record: LicenseRecord) => void;
  onDelete: (code: string) => void;
  onClose: () => void;
}

function blank(prefillCode?: string): LicenseRecord {
  const code = prefillCode ?? '';
  return {
    code, name: code ? (US_NAMES[code] ?? code) : '',
    status: 'progress', imlc: false, home: false,
    date: null, expires: '', issued: '',
    licenseNo: '', cycle: 'Biennial',
    fee: '', applicationFee: '',
    timeline: '', cmeHours: null,
    telehealthNotes: '',
    board: '', boardUrl: '',
    lastChecked: '',
    requirements: [], documents: [], notes: '',
  };
}

export function LicenseDrawer({ license, existingCodes, prefillCode, onSave, onDelete, onClose }: LicenseDrawerProps) {
  const isNew = license === null;
  const [draft, setDraft] = useState<LicenseRecord>(() =>
    license ? structuredClone(license) : blank(prefillCode),
  );

  const set = useCallback(<K extends keyof LicenseRecord>(key: K, value: LicenseRecord[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  }, []);

  const onCode = (code: string) => {
    setDraft(prev => ({ ...prev, code, name: US_NAMES[code] ?? code }));
  };

  // Esc closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Available state codes for the "add" select
  const allCodes = US_GRID.map(([code]) => code);
  const availableCodes = allCodes
    .filter(c => c === draft.code || !existingCodes.includes(c))
    .sort((a, b) => (US_NAMES[a] ?? a).localeCompare(US_NAMES[b] ?? b));

  // Requirements
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
  const canSave = !!draft.code;
  const dUntil = daysUntil(draft.expires);
  const statusInfo = STATE_STATUS[draft.status] ?? STATE_STATUS['none']!;

  return (
    <>
      {/* Scrim */}
      <div className="scrim" onClick={onClose} aria-hidden="true" />

      {/* Drawer panel */}
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="License details">

        {/* ── Head ── */}
        <header className="drawer-head">
          <div style={{ flex: 1 }}>
            <div className="drawer-eyebrow">{isNew ? 'Add state license' : 'State license'}</div>
            <div className="drawer-title">
              <span className="mono">{draft.code || '—'}</span>
              <span style={{ fontWeight: 500, fontSize: 16, color: 'var(--ink-2)' }}>
                {draft.name || 'Select a state'}
              </span>
            </div>
            <div className="drawer-badges">
              <StatusPill variant={statusInfo.variant} label={statusInfo.label} />
              {draft.home && <span className="mini-badge">★ Home state</span>}
              {draft.imlc && <span className="mini-badge">IMLC-eligible</span>}
              {dUntil != null && draft.status !== 'none' && (
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

          {/* Status segmented control */}
          <div className="dgroup">
            <div className="dgroup-head"><span className="dgroup-title">Status</span></div>
            <div className="seg-status">
              {LICENSE_STATUS_OPTS.map(([key, label, cls]) => (
                <button
                  key={key}
                  type="button"
                  className={draft.status === key ? `on ${cls}` : ''}
                  onClick={() => set('status', key as LicenseRecord['status'])}
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
              {isNew && (
                <div className="field full">
                  <label htmlFor="state-select">State</label>
                  <select
                    id="state-select"
                    className="input"
                    value={draft.code}
                    onChange={e => onCode(e.target.value)}
                  >
                    <option value="">Select a state…</option>
                    {availableCodes.map(c => (
                      <option key={c} value={c}>{c} — {US_NAMES[c] ?? c}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="field">
                <label htmlFor="license-no">License number</label>
                <input id="license-no" className="input mono" value={draft.licenseNo}
                  placeholder="e.g. MD-000000"
                  onChange={e => set('licenseNo', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="license-fee">Renewal fee</label>
                <input id="license-fee" className="input" value={draft.fee}
                  placeholder="e.g. $300"
                  onChange={e => set('fee', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="license-application-fee">Application fee</label>
                <input id="license-application-fee" className="input" value={draft.applicationFee}
                  placeholder="e.g. $400"
                  onChange={e => set('applicationFee', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="license-timeline">Est. timeline</label>
                <input id="license-timeline" className="input" value={draft.timeline}
                  placeholder="e.g. 8–12 weeks"
                  onChange={e => set('timeline', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="license-cme-hours">CME hours / cycle</label>
                <input id="license-cme-hours" className="input" type="number" min={0}
                  value={draft.cmeHours ?? ''}
                  placeholder="e.g. 40"
                  onChange={e => set('cmeHours', e.target.value === '' ? null : Number(e.target.value))} />
              </div>
              <div className="field">
                <label htmlFor="license-issued">Issued</label>
                <input id="license-issued" className="input" type="date" value={draft.issued}
                  onChange={e => set('issued', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="license-expires">Expires / renews</label>
                <input id="license-expires" className="input" type="date" value={draft.expires}
                  onChange={e => set('expires', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="license-cycle">Renewal cycle</label>
                <select id="license-cycle" className="input" value={draft.cycle}
                  onChange={e => set('cycle', e.target.value as LicenseRecord['cycle'])}>
                  {RENEWAL_CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="license-imlc">IMLC eligible</label>
                <select id="license-imlc" className="input"
                  value={draft.imlc ? 'yes' : 'no'}
                  onChange={e => set('imlc', e.target.value === 'yes')}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div className="field full">
                <label htmlFor="license-board">Licensing board</label>
                <input id="license-board" className="input" value={draft.board}
                  placeholder="e.g. State Board of Medicine"
                  onChange={e => set('board', e.target.value)} />
              </div>
              <div className="field full">
                <label htmlFor="license-board-url">Board website</label>
                <input id="license-board-url" className="input" value={draft.boardUrl}
                  placeholder="e.g. board.state.gov"
                  onChange={e => set('boardUrl', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Telehealth */}
          <div className="dgroup">
            <div className="dgroup-head"><span className="dgroup-title">Telehealth</span></div>
            <div className="field full">
              <label htmlFor="license-telehealth-notes">Telehealth rules</label>
              <textarea
                id="license-telehealth-notes"
                className="textarea"
                value={draft.telehealthNotes}
                placeholder="State-specific telehealth rules, restrictions, registration requirements…"
                onChange={e => set('telehealthNotes', e.target.value)}
              />
            </div>
          </div>

          {/* Renewal requirements */}
          <div className="dgroup">
            <div className="dgroup-head">
              <span className="dgroup-title">Renewal requirements</span>
              <span className="dgroup-meta">{reqDone}/{draft.requirements.length} done</span>
              <button type="button" className="btn ghost" onClick={addReq}>
                <Plus size={13} /> Add
              </button>
            </div>
            {draft.requirements.length === 0 && (
              <div className="empty-mini">No requirements logged yet. Add CME hours, fees, portal steps, exams…</div>
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
                  placeholder="Describe a renewal requirement…"
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
              <div className="empty-mini">Link files, portals, or note where each document lives.</div>
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
              placeholder="Renewal window, processing times, gotchas, contacts…"
              onChange={e => set('notes', e.target.value)}
            />
          </div>

        </div>

        {/* ── Foot ── */}
        <footer className="drawer-foot">
          {!isNew && (
            <button type="button" className="btn danger" onClick={() => onDelete(draft.code)}>
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
            {isNew ? 'Add license' : 'Save changes'}
          </button>
        </footer>

      </aside>
    </>
  );
}
