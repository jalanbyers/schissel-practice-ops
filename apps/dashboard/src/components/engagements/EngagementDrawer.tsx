'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Check, FileText } from 'lucide-react';
import { StatusPill, ENG_STATUS } from '@/components/ui/StatusPill';
import { uid } from '@/lib/date-helpers';
import { ENG_STATUS_OPTS, ENG_MODELS } from '@/lib/types';
import type { EngagementRecord, Requirement, LicenseDoc } from '@/lib/types';
import { LicensureAnalysis } from './LicensureAnalysis';

interface EngagementDrawerProps {
  engagement: EngagementRecord | null;
  onSave: (record: EngagementRecord) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function blank(): EngagementRecord {
  return {
    id: uid(), name: '', model: 'Async visits', volume: '', rate: '',
    status: 'prospect', startDate: '', contact: '', portalUrl: '',
    payTerms: '', requirements: [], documents: [], notes: '',
  };
}

export function EngagementDrawer({ engagement, onSave, onDelete, onClose }: EngagementDrawerProps) {
  const isNew = engagement === null;
  const [draft, setDraft] = useState<EngagementRecord>(() =>
    engagement ? structuredClone(engagement) : blank(),
  );

  const set = useCallback(<K extends keyof EngagementRecord>(key: K, value: EngagementRecord[K]) => {
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
  const statusInfo = ENG_STATUS[draft.status] ?? ENG_STATUS['ended']!;

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />

      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Engagement details">

        {/* ── Head ── */}
        <header className="drawer-head">
          <div style={{ flex: 1 }}>
            <div className="drawer-eyebrow">{isNew ? 'Add engagement' : 'Engagement'}</div>
            <div className="drawer-title">
              <span style={{ fontSize: 18 }}>{draft.name || 'New engagement'}</span>
            </div>
            <div className="drawer-badges">
              <StatusPill variant={statusInfo.variant} label={statusInfo.label} />
              {draft.model && <span className="mini-badge">{draft.model}</span>}
              {draft.rate  && <span className="mini-badge">{draft.rate}</span>}
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
              {ENG_STATUS_OPTS.map(([key, label, cls]) => (
                <button
                  key={key}
                  type="button"
                  className={draft.status === key ? `on ${cls}` : ''}
                  onClick={() => set('status', key as EngagementRecord['status'])}
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
                <label htmlFor="eng-name">Engagement name</label>
                <input id="eng-name" className="input" value={draft.name}
                  placeholder="e.g. Teladoc Health"
                  onChange={e => set('name', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="eng-model">Model</label>
                <select id="eng-model" className="input" value={draft.model}
                  onChange={e => set('model', e.target.value as EngagementRecord['model'])}>
                  {ENG_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="eng-start">Status started</label>
                <input id="eng-start" className="input" type="date" value={draft.startDate}
                  onChange={e => set('startDate', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="eng-volume">Volume</label>
                <input id="eng-volume" className="input" value={draft.volume}
                  placeholder="e.g. 62 visits MTD"
                  onChange={e => set('volume', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="eng-rate">Rate</label>
                <input id="eng-rate" className="input" value={draft.rate}
                  placeholder="e.g. $32 / visit"
                  onChange={e => set('rate', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="eng-pay-terms">Payment terms</label>
                <input id="eng-pay-terms" className="input" value={draft.payTerms}
                  placeholder="e.g. Net 15 · biweekly ACH"
                  onChange={e => set('payTerms', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="eng-contact">Contact</label>
                <input id="eng-contact" className="input" value={draft.contact}
                  placeholder="account manager"
                  onChange={e => set('contact', e.target.value)} />
              </div>
              <div className="field full">
                <label htmlFor="eng-portal">Portal / website</label>
                <input id="eng-portal" className="input" value={draft.portalUrl}
                  placeholder="e.g. provider.platform.com"
                  onChange={e => set('portalUrl', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Onboarding requirements */}
          <div className="dgroup">
            <div className="dgroup-head">
              <span className="dgroup-title">Onboarding requirements</span>
              <span className="dgroup-meta">{reqDone}/{draft.requirements.length} done</span>
              <button type="button" className="btn ghost" onClick={addReq}>
                <Plus size={13} /> Add
              </button>
            </div>
            {draft.requirements.length === 0 && (
              <div className="empty-mini">
                Add onboarding steps — platform credentialing, malpractice COI, direct deposit, training…
              </div>
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

          {/* Licensure review — agent drafts for this contract's required states */}
          <LicensureAnalysis contractId={draft.id} saved={!isNew} />

          {/* Reference documents */}
          <div className="dgroup">
            <div className="dgroup-head">
              <span className="dgroup-title">Reference documents</span>
              <button type="button" className="btn ghost" onClick={addDoc}>
                <Plus size={13} /> Add
              </button>
            </div>
            {draft.documents.length === 0 && (
              <div className="empty-mini">Link contracts, rate exhibits, portal logins…</div>
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
              placeholder="Payout schedule, volume trends, contacts, renewal terms…"
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
            {isNew ? 'Add engagement' : 'Save changes'}
          </button>
        </footer>

      </aside>
    </>
  );
}
