import type { MockMonth } from '@/lib/mock-data';

interface BarChartProps {
  months: MockMonth[];
}

const fmtUSD = (n: number) => '$' + n.toLocaleString('en-US');

export function BarChart({ months }: BarChartProps) {
  const max = Math.max(...months.flatMap(m => [m.rev, m.exp]));

  return (
    <div className="chart">
      {months.map((m) => (
        <div key={m.m} className={`bar-col${m.partial ? ' partial' : ''}`}>
          <div className="bar-pair">
            <div
              className="bar rev"
              style={{ height: `${(m.rev / max) * 100}%` }}
              title={`${m.m} revenue ${fmtUSD(m.rev)}`}
            />
            <div
              className="bar exp"
              style={{ height: `${(m.exp / max) * 100}%` }}
              title={`${m.m} expenses ${fmtUSD(m.exp)}`}
            />
          </div>
          <div className="bar-m">{m.m}{m.partial ? '*' : ''}</div>
        </div>
      ))}
    </div>
  );
}
