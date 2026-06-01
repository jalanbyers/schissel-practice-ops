import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

type Trend = 'up' | 'down' | 'flat';

interface KpiStatProps {
  label: string;
  value: string | number;
  trend: Trend;
  trendLabel: string;
  sub: string;
  Icon: LucideIcon;
  href: string;
}

const TREND_ARROW: Record<Trend, string> = { up: '↑', down: '↓', flat: '→' };

export function KpiStat({ label, value, trend, trendLabel, sub, Icon, href }: KpiStatProps) {
  return (
    <Link href={href} className="card kpi clickable col-3" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className="kpi-ico">
          <Icon size={17} />
        </span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot">
        <span className={`trend ${trend}`}>
          {TREND_ARROW[trend]} {trendLabel}
        </span>
        <span className="kpi-sub">{sub}</span>
      </div>
    </Link>
  );
}
