'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Check, FileText } from 'lucide-react';
import { StatusPill, PAYER_STATUS } from '@/components/ui/StatusPill';
import { uid } from '@/lib/date-helpers';
import { PAYER_STATUS_OPTS, PAYER_TYPES } from '@/lib/types';
import type { PayerRecord, Requirement, LicenseDoc } from '@/lib/types';

interface PayerDrawerProps {
  payer: PayerRecord | null;   // null → add mode
  onSave: (record: PayerRecord) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function blank(): PayerRecord {
  return {
    id: uid(), name: '', type: 'Commercial', status: 'notstarted',
    date: '', effectiveDate: '', revalidation: '',
    providerId: '', rep: '', portalUrl: '',
    requirements: [], documents: [], notes: '',
  };
}

export function PayerDrawer({ payer, onSave, onDelete, onClose }: PayerDrawerProps) {
  const isNew = payer === null;
  const [draft, setDraft] = useState<PayerRecord>(() =>
    payer ? structuredClone(payer) : blank(),
  );

  const set = useCallback(<K extends keyof PayerRecord>(key: K, value: PayerRecord[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

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
  const canSave = !!draft.name.trim();
  const statusInfo = PAYER_STATUS[draft.status] ?? PAYER_STATUS['notstarted']!;

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />

      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Payer enrollment details">

        {/* ── Head ── */}
        <header className="drawer-head">
          <div style={{ flex: 1 }}>
            <div className="drawer-eyebrow">{isNew ? 'Add payer / platform' : 'Enrollment'}</div>
            <div className="drawer-title">
              <span style={{ fontSize: 18 }}>{draft.name || 'New payer'}</span>
            </div>
            <div className="drawer-badges">
              <StatusPill variant={statusInfo.variant} label={statusInfo.label} />
              <span className="mini-badge">{draft.type}</span>
              {draft.providerId && <span className="mini-badge mono">{draft.providerId}</span>}
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
              {PAYER_STATUS_OPTS.map(([key, label, cls]) => (
                <button
                  key={key}
                  type="button"
                  className={draft.status === key ? `on ${cls}` : ''}
                  onClick={() => set('status', key as PayerRecord['status'])}
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
                <label htmlFor="payer-name">Payer / platform name</label>
                <input id="payer-name" className="input" value={draft.name}
                  placeholder="e.g. UnitedHealthcare"
                  onChange={e => set('name', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="payer-type">Type</label>
                <select id="payer-type" className="input" value={draft.type}
                  onChange={e => set('type', e.target.value as PayerRecord['type'])}>
                  {PAYER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="payer-provider-id">Provider ID / PTAN</label>
                <input id="payer-provider-id" className="input mono" value={draft.providerId}
                  placeholder="optional"
                  onChange={e => set('providerId', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="payer-date">Last updated</label>
                <input id="payer-date" className="input" type="date" value={draft.date}
                  onChange={e => set('date', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="payer-effective">Effective date</label>
                <input id="payer-effective" className="input" type="date" value={draft.effectiveDate}
                  onChange={e => set('effectiveDate', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="payer-revalidation">Revalidation due</label>
                <input id="payer-revalidation" className="input" type="date" value={draft.revalidation}
                  onChange={e => set('revalidation', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="payer-rep">Network rep / MAC</label>
                <input id="payer-rep" className="input" value={draft.rep}
                  placeholder="optional"
                  onChange={e => set('rep', e.target.value)} />
              </div>
              <div className="field full">
                <label htmlFor="payer-portal">Portal / website</label>
                <input id="payer-portal" className="input" value={draft.portalUrl}
                  placeholder="e.g. uhcprovider.com"
                  onChange={e => set('portalUrl', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Enrollment requirements */}
          <div className="dgroup">
            <div className="dgroup-head">
              <span className="dgroup-title">Enrollment requirements</span>
              <span className="dgroup-meta">{reqDone}/{draft.requirements.length} done</span>
              <button type="button" className="btn ghost" onClick={addReq}>
                <Plus size={13} /> Add
              </button>
            </div>
            {draft.requirements.length === 0 && (
              <div className="empty-mini">No requirements yet. Add CAQH attestation, W-9, EFT/ERA, contract signature…</div>
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
                  placeholder="Describe a requirement…"
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
              <div className="empty-mini">Link contracts, confirmation letters, portal logins…</div>
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
              placeholder="Timeline, contacts, gotchas, effective-date estimates…"
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
            {isNew ? 'Add payer' : 'Save changes'}
          </button>
        </footer>

      </aside>
    </>
  );
}
