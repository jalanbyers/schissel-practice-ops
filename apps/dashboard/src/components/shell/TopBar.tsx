'use client';

import { Search, Bell, Settings2 } from 'lucide-react';
import { MOCK_SETTINGS } from '@/lib/mock-data';

interface TopBarProps {
  title: string;
  date?: string;
}

// Default comes from MOCK_SETTINGS rather than a literal: a hardcoded fallback
// here would print a different date than every badge computes from the moment
// the demo clock moves.
export function TopBar({ title, date = MOCK_SETTINGS.today }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="crumb">{title}</div>

      {/* Search — presentational in v1 */}
      <div className="search">
        <Search size={14} />
        <input
          type="text"
          placeholder="Search states, payers, tasks…"
          aria-label="Search"
          readOnly
        />
      </div>

      <div className="topbar-right">
        <span className="topbar-date mono">{date}</span>
        <button className="icon-btn" aria-label="Notifications" type="button">
          <Bell size={16} />
        </button>
        <button className="icon-btn" aria-label="Settings" type="button">
          <Settings2 size={16} />
        </button>
      </div>
    </header>
  );
}
