import { MOCK_FINANCES } from './mock-data';
import { uid } from './date-helpers';
import type { FinancesState, LedgerEntry } from './types';

export function seedFinances(): FinancesState {
  // June ledger entries derived from the mock $48,200 revenue / $9,000 expenses
  const ledger: LedgerEntry[] = [
    { id: uid(), date: '2026-06-01', type: 'income',  category: 'Platform payout', source: 'Teladoc Health', amount: 21900, note: 'May payout' },
    { id: uid(), date: '2026-06-05', type: 'income',  category: 'Platform payout', source: 'Amwell',         amount: 14400, note: '' },
    { id: uid(), date: '2026-06-08', type: 'income',  category: 'Platform payout', source: 'Wheel',          amount: 11900, note: '' },
    { id: uid(), date: '2026-06-10', type: 'expense', category: 'Insurance',        source: 'MedPro Group',   amount: 4500,  note: 'Malpractice Q2' },
    { id: uid(), date: '2026-06-12', type: 'expense', category: 'Services',         source: 'CPA / bookkeeping', amount: 2400, note: '' },
    { id: uid(), date: '2026-06-15', type: 'expense', category: 'Software',         source: 'EHR platform',   amount: 650,   note: '' },
    { id: uid(), date: '2026-06-18', type: 'expense', category: 'Education',        source: 'CME credits',    amount: 800,   note: '' },
    { id: uid(), date: '2026-06-20', type: 'expense', category: 'Other',            source: 'Misc',           amount: 650,   note: '' },
  ];

  return {
    currentMonth: 'June 2026',
    // History: Jan–May (non-partial months from the mock)
    history: MOCK_FINANCES.months.filter(m => !m.partial),
    ledger,
    taxRate: 0.27,
    taxPayments: [
      { id: uid(), label: 'Q1 2026', due: '2026-04-15', paid: true,  paidAmount: 11276 },
      { id: uid(), label: 'Q2 2026', due: '2026-06-17', paid: false, paidAmount: 0 },
      { id: uid(), label: 'Q3 2026', due: '2026-09-15', paid: false, paidAmount: 0 },
      { id: uid(), label: 'Q4 2026', due: '2027-01-15', paid: false, paidAmount: 0 },
    ],
  };
}
