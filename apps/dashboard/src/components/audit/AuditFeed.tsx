'use client';

import { useAuditLog } from '@/lib/audit';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShieldCheck } from 'lucide-react';

const ENTITY_LABELS: Record<string, string> = {
  license:    'License',
  payer:      'Payer',
  engagement: 'Engagement',
  ledger:     'Ledger',
  task:       'Task',
};

function relativeTime(isoTs: string): string {
  const diffMs = Date.now() - new Date(isoTs).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s <  60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(isoTs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function AuditFeed() {
  const events = useAuditLog();

  if (events.length === 0) {
    return (
      <EmptyState
        Icon={ShieldCheck}
        title="No activity yet"
        desc="Changes you make to licenses, payers, engagements, finances, and tasks will appear here."
      />
    );
  }

  return (
    <div className="audit-feed">
      {events.map(ev => (
        <div key={ev.id} className="audit-row">
          <span className={`audit-action ${ev.action}`}>{ev.action}</span>
          <div style={{ flex: 1 }}>
            <div className="audit-label">{ev.label}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
              {ENTITY_LABELS[ev.entity] ?? ev.entity}
            </div>
          </div>
          <div className="audit-ts">{relativeTime(ev.ts)}</div>
        </div>
      ))}
    </div>
  );
}
