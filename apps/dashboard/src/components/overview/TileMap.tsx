'use client';

import { US_GRID, US_NAMES } from '@/lib/us-grid';
import { STATE_STATUS } from '@/components/ui/StatusPill';
import type { MockState } from '@/lib/mock-data';

interface TileMapProps {
  states: MockState[];
}

export function TileMap({ states }: TileMapProps) {
  const byCode = Object.fromEntries(states.map(s => [s.code, s]));

  return (
    <div className="tilemap">
      {US_GRID.map(([code, row, col]) => {
        const s = byCode[code] ?? { code, name: US_NAMES[code] ?? code, status: 'none' as const, date: null, imlc: false };
        const meta = STATE_STATUS[s.status] ?? STATE_STATUS['none']!;

        // Sub-label: expire month for dated states, dots for in-progress
        const exp = s.date;
        const sub =
          s.status === 'none' ? '' :
          s.status === 'progress' ? '•••' :
          exp && exp.includes('-') ? exp.slice(5) : '';

        const title = [
          US_NAMES[code] ?? s.name,
          `— ${meta.label}`,
          exp ? `· ${exp}` : '',
          s.imlc ? '· IMLC' : '',
        ].filter(Boolean).join(' ');

        return (
          <div
            key={code}
            className={`tile mini s-${s.status}${s.home ? ' home' : ''}`}
            style={{ gridColumn: col, gridRow: row }}
            title={title}
          >
            {s.imlc && <span className="imlc-dot" />}
            <span className="tile-code">{code}</span>
            {sub && <span className="tile-sub">{sub}</span>}
          </div>
        );
      })}
    </div>
  );
}
