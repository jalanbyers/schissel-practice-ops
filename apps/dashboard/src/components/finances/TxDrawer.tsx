'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { uid } from '@/lib/date-helpers';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/lib/types';
import type { LedgerEntry, TxType } from '@/lib/types';

interface TxDrawerProps {
  tx: LedgerEntry | null;      // null → new entry
  defaultType?: TxType;        // pre-select type when adding
  onSave: (entry: LedgerEntry) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function blank(type: TxType = 'expense'): LedgerEntry {
  return {
    id: uid(),
    date: '2026-06-01',
    type,
    category: type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
    source: '',
    amount: 0,
    note: '',
  };
}

export function TxDrawer({ tx, defaultType, onSave, onDelete, onClose }: TxDrawerProps) {
  const isNew = tx === null;
  const [draft, setDraft] = useState<LedgerEntry>(() =>
    tx ? { ...tx } : blank(defaultType),
  );

  const set = <K extends keyof LedgerEntry>(key: K, value: LedgerEntry[K]) =>
    setDraft(prev => ({ ...prev, [key]: value }));

  const setType = (type: TxType) =>
    setDraft(prev => ({
      ...prev,
      type,
      category: type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
    }));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const cats = draft.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const canSave = draft.amount > 0 && !!draft.source.trim();

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />

      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Transaction entry">

        {/* ── Head ── */}
        <header className="drawer-head">
          <div style={{ flex: 1 }}>
            <div className="drawer-eyebrow">{isNew ? 'Log entry' : 'Edit entry'}</div>
            <div className="drawer-title">
              <span style={{ fontSize: 18 }}>
                {draft.source || (draft.type === 'income' ? 'New income' : 'New expense')}
              </span>
            </div>
            <div className="drawer-badges">
              <span className={`pill ${draft.type === 'income' ? 'ok' : 'idle'}`}>
                <span className="dot" />
                {draft.type === 'income' ? 'Income' : 'Expense'}
              </span>
              <span className="mini-badge">{draft.category}</span>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close drawer" style={{ flex: 'none' }}>
            <X size={18} />
          </button>
        </header>

        {/* ── Body ── */}
        <div className="drawer-body">

          {/* Type toggle */}
          <div className="dgroup">
            <div className="dgroup-head"><span className="dgroup-title">Type</span></div>
            <div className="seg-status">
              <button
                type="button"
                className={draft.type === 'income' ? 'on ok' : ''}
                onClick={() => setType('income')}
              >
                <span className="dot" style={{ background: 'var(--ok)' }} /> Income
              </button>
              <button
                type="button"
                className={draft.type === 'expense' ? 'on idle' : ''}
                onClick={() => setType('expense')}
              >
                <span className="dot" style={{ background: 'var(--idle)' }} /> Expense
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="dgroup">
            <div className="dgroup-head"><span className="dgroup-title">Details</span></div>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="tx-date">Date</label>
                <input id="tx-date" className="input" type="date" value={draft.date}
                  onChange={e => set('date', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="tx-amount">Amount (USD)</label>
                <input
                  id="tx-amount"
                  className="input mono"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.amount === 0 ? '' : draft.amount}
                  placeholder="0"
                  onChange={e => set('amount', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="field full">
                <label htmlFor="tx-source">
                  {draft.type === 'income' ? 'Source' : 'Vendor'}
                </label>
                <input
                  id="tx-source"
                  className="input"
                  value={draft.source}
                  placeholder={draft.type === 'income' ? 'e.g. Teladoc Health' : 'e.g. MedPro Group'}
                  onChange={e => set('source', e.target.value)}
                />
              </div>
              <div className="field full">
                <label htmlFor="tx-category">Category</label>
                <select id="tx-category" className="input" value={draft.category}
                  onChange={e => set('category', e.target.value)}>
                  {cats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field full">
                <label htmlFor="tx-note">Note</label>
                <input id="tx-note" className="input" value={draft.note}
                  placeholder="optional"
                  onChange={e => set('note', e.target.value)} />
              </div>
            </div>
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
            {isNew ? 'Add entry' : 'Save changes'}
          </button>
        </footer>

      </aside>
    </>
  );
}
