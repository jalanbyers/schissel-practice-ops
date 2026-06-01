import { Card } from '@/components/ui/Card';
import { StatusPill, ENG_STATUS } from '@/components/ui/StatusPill';
import type { MockEngagement } from '@/lib/mock-data';

interface ActiveEngagementsProps {
  engagements: MockEngagement[];
}

export function ActiveEngagements({ engagements }: ActiveEngagementsProps) {
  const activeCount = engagements.filter(e => e.status === 'active').length;

  return (
    <div className="col-5">
      <Card
        title="Active engagements"
        desc={`${activeCount} active 1099 contracts`}
        href="/engagements"
        ctaLabel="View engagements"
      >
        {engagements.map((e) => {
          const s = ENG_STATUS[e.status] ?? ENG_STATUS['ended']!;
          return (
            <div key={e.name} className="eng-row">
              <div className="eng-logo">{e.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <div className="eng-name">{e.name}</div>
                <div className="eng-model">{e.model}</div>
              </div>
              <div className="eng-stat" style={{ marginLeft: 'auto' }}>
                <div className="eng-vol">{e.volume}</div>
                <div className="eng-rate">{e.rate}</div>
              </div>
              <StatusPill variant={s.variant} label={s.label} />
            </div>
          );
        })}
      </Card>
    </div>
  );
}
