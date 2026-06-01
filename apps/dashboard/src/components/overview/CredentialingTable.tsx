import { Card } from '@/components/ui/Card';
import { StatusPill, PAYER_STATUS } from '@/components/ui/StatusPill';
import type { MockPayer } from '@/lib/mock-data';

interface CredentialingTableProps {
  payers: MockPayer[];
}

export function CredentialingTable({ payers }: CredentialingTableProps) {
  const approved = payers.filter(p => p.status === 'approved').length;

  return (
    <div className="col-5">
      <Card
        title="Credentialing & payer enrollment"
        desc={`${approved} approved · ${payers.length - approved} in flight`}
        href="/credentialing"
        ctaLabel="View credentialing"
      >
        <table className="tbl">
          <thead>
            <tr>
              <th>Payer / platform</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {payers.map((p) => {
              const s = PAYER_STATUS[p.status] ?? PAYER_STATUS['notstarted']!;
              return (
                <tr key={p.name} className="row">
                  <td className="name">
                    {p.name}
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 400 }}>{p.type}</div>
                  </td>
                  <td><StatusPill variant={s.variant} label={s.label} /></td>
                  <td className="num" style={{ color: 'var(--ink-3)' }}>
                    {p.date ? p.date.slice(5) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
