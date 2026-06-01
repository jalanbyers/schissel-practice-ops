import { Card } from '@/components/ui/Card';
import { Check } from 'lucide-react';
import type { MockCheckItem } from '@/lib/mock-data';

interface ComplianceChecklistProps {
  checklist: MockCheckItem[];
}

const TODAY = new Date('2026-06-01');
const isSoon = (date: string | null) => {
  if (!date || !date.includes('-')) return false;
  return new Date(date).getTime() - TODAY.getTime() < 14 * 864e5;
};

export function ComplianceChecklist({ checklist }: ComplianceChecklistProps) {
  const done = checklist.filter(c => c.status === 'done').length;
  const pct = Math.round((done / checklist.length) * 100);
  const mid = Math.ceil(checklist.length / 2);
  const cols = [checklist.slice(0, mid), checklist.slice(mid)];

  const headRight = (
    <div style={{ minWidth: 200, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div className="progress-wrap">
        <span className="progress-pct">{pct}%</span>
        <div className="progress">
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'right' }}>
        {done} of {checklist.length} complete
      </span>
    </div>
  );

  return (
    <div className="col-12">
      <Card
        title="Setup & compliance"
        desc="Entity, banking, HIPAA and insurance readiness"
        href="/compliance"
        ctaLabel="View compliance"
        headRight={headRight}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
          {cols.map((col, ci) => (
            <div key={ci} className="check-list">
              {col.map((c) => (
                <div key={c.task} className="check-item">
                  <span className={`check-box ${c.status}`}>
                    {c.status === 'done' && <Check size={13} />}
                    {c.status === 'progress' && <span style={{ fontSize: 11, fontWeight: 700 }}>·</span>}
                  </span>
                  <span className={`check-task${c.status === 'done' ? ' done' : ''}`}>{c.task}</span>
                  <span className="check-meta">
                    <span className="tag">{c.group}</span>
                    {c.status !== 'done' && c.date && (
                      <span className={`check-due${isSoon(c.date) ? ' soon' : ''}`}>
                        due {c.date.slice(5)}
                      </span>
                    )}
                    {c.status === 'done' && <span className="check-due">done</span>}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
