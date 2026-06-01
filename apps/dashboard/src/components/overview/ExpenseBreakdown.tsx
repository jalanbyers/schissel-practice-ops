import type { MockExpenseCategory } from '@/lib/mock-data';

const EXP_COLORS = [
  'var(--primary)', '#3a9d9d', '#66b8b8', '#93cccc', '#bfe0e0', '#dceeee',
];
const fmtUSD = (n: number) => '$' + n.toLocaleString('en-US');

interface ExpenseBreakdownProps {
  categories: MockExpenseCategory[];
}

export function ExpenseBreakdown({ categories }: ExpenseBreakdownProps) {
  const total = categories.reduce((a, c) => a + c.amount, 0);

  return (
    <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>Expenses by category</span>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
          this period · {fmtUSD(total)}
        </span>
      </div>

      {/* Stacked proportion bar */}
      <div className="exp-stack">
        {categories.map((c, i) => (
          <div
            key={c.tag}
            className="exp-seg"
            style={{ width: `${(c.amount / total) * 100}%`, background: EXP_COLORS[i % EXP_COLORS.length] }}
            title={`${c.label} ${fmtUSD(c.amount)}`}
          />
        ))}
      </div>

      {/* Per-category list */}
      <div className="exp-list">
        {categories.map((c, i) => (
          <div key={c.tag} className="exp-row">
            <span className="exp-dot" style={{ background: EXP_COLORS[i % EXP_COLORS.length] }} />
            <span className="tag">{c.tag}</span>
            <span style={{ color: 'var(--ink-2)' }}>{c.label}</span>
            <span className="exp-amt">{fmtUSD(c.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
