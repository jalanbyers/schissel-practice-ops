import type { FinancesState } from './types';

// All computations are anchored to this mock "today".
// In production replace with server-rendered current date.
const CURRENT_MONTH_PREFIX = '2026-06';
const CURRENT_MONTH_LABEL  = 'Jun';

export interface FinMTD { rev: number; exp: number; net: number; }
export interface FinMonth { m: string; rev: number; exp: number; partial?: boolean; }

/** Sum all ledger entries in the current month. */
export function finMTD(fin: FinancesState): FinMTD {
  const entries = fin.ledger.filter(t => t.date.startsWith(CURRENT_MONTH_PREFIX));
  const rev = entries.filter(t => t.type === 'income').reduce((a, t)  => a + t.amount, 0);
  const exp = entries.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  return { rev, exp, net: rev - exp };
}

/** Last 5 history months + current month derived from ledger (flagged partial). */
export function finMonths(fin: FinancesState): FinMonth[] {
  const mtd = finMTD(fin);
  return [
    ...fin.history.slice(-5),
    { m: CURRENT_MONTH_LABEL, rev: mtd.rev, exp: mtd.exp, partial: true },
  ];
}

/** Group current-month expense entries by category, descending by amount. */
export function finExpenseByCategory(fin: FinancesState): { tag: string; label: string; amount: number }[] {
  const entries = fin.ledger.filter(
    t => t.date.startsWith(CURRENT_MONTH_PREFIX) && t.type === 'expense',
  );
  const grouped: Record<string, number> = {};
  for (const t of entries) {
    grouped[t.category] = (grouped[t.category] ?? 0) + t.amount;
  }
  return Object.entries(grouped)
    .map(([tag, amount]) => ({ tag, label: tag, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/** Year-to-date net: sum of all history + current MTD. */
export function finYTDNet(fin: FinancesState): number {
  const histNet = fin.history.reduce((a, m) => a + m.rev - m.exp, 0);
  return histNet + finMTD(fin).net;
}

/** Net income attributable to a given quarter label (e.g. "Q2 2026"). */
export function finQuarterNet(fin: FinancesState, label: string): number {
  const qNum = label[1];
  const QUARTER_MONTHS: Record<string, string[]> = {
    '1': ['Jan', 'Feb', 'Mar'],
    '2': ['Apr', 'May', 'Jun'],
    '3': ['Jul', 'Aug', 'Sep'],
    '4': ['Oct', 'Nov', 'Dec'],
  };
  const months = QUARTER_MONTHS[qNum] ?? [];
  const histNet = fin.history
    .filter(m => months.includes(m.m))
    .reduce((a, m) => a + m.rev - m.exp, 0);

  // Current month (June) belongs to Q2 — add MTD
  if (months.includes(CURRENT_MONTH_LABEL)) {
    return histNet + finMTD(fin).net;
  }
  return histNet;
}

export const fmtUSD = (n: number): string =>
  '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
