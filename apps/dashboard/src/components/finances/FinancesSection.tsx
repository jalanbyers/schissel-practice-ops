'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, DollarSign } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { BarChart } from '@/components/overview/BarChart';
import { ExpenseBreakdown } from '@/components/overview/ExpenseBreakdown';
import { TxDrawer } from './TxDrawer';
import { finMTD, finMonths, finExpenseByCategory, finYTDNet, finQuarterNet, fmtUSD } from '@/lib/finance-helpers';
import { fmtDate } from '@/lib/date-helpers';
import { TAX_RATE_OPTS } from '@/lib/types';
import type { LedgerEntry, TxType } from '@/lib/types';
import { clientFetch } from '@/lib/client-fetch';
import { emitAudit } from '@/lib/audit';
import { useFinances, FINANCES_KEY } from '@/hooks/use-finances';

type DrawerState =
  | { kind: 'closed' }
  | { kind: 'edit'; id: string }
  | { kind: 'new'; defaultType: TxType };

export function FinancesSection() {
  const queryClient = useQueryClient();
  const { data: fin, isLoading, isError } = useFinances();
  const [drawer, setDrawer] = useState<DrawerState>({ kind: 'closed' });

  if (isLoading) return <LoadingState />;
  if (isError || !fin) return <LoadingState error message="Could not load finances." />;

  const mtd    = finMTD(fin);
  const months = finMonths(fin);
  const cats   = finExpenseByCategory(fin);
  const ytdNet = finYTDNet(fin);
  const totals = { rev: months.reduce((a,m)=>a+m.rev,0), exp: months.reduce((a,m)=>a+m.exp,0), net: months.reduce((a,m)=>a+m.rev-m.exp,0) };

  const kpis = [
    { label:'MTD revenue',    value: fmtUSD(mtd.rev), sub:`${fin.ledger.filter(t=>t.type==='income').length} income entries` },
    { label:'MTD expenses',   value: fmtUSD(mtd.exp), sub:`${fin.ledger.filter(t=>t.type==='expense').length} expense entries` },
    { label:'MTD net',        value: fmtUSD(mtd.net), sub: mtd.rev>0?`${Math.round((mtd.net/mtd.rev)*100)}% margin`:'—' },
    { label:'Set aside (YTD)',value: fmtUSD(Math.round(ytdNet*fin.taxRate)), sub:`at ${Math.round(fin.taxRate*100)}% of net` },
  ];

  const ledgerSorted = [...fin.ledger].sort((a,b)=>(b.date||'').localeCompare(a.date||''));

  const saveTx = async (tx: LedgerEntry) => {
    const isCreating = !fin.ledger.some(t => t.id === tx.id);
    await clientFetch(
      isCreating ? '/finances/ledger' : `/finances/ledger/${tx.id}`,
      { method: isCreating ? 'POST' : 'PATCH', body: JSON.stringify(tx) },
    );
    emitAudit({
      action: isCreating ? 'create' : 'update', entity: 'ledger', entityId: tx.id,
      label: `${tx.type==='income'?'Income':'Expense'} from "${tx.source}" ${isCreating?'logged':'updated'} (${fmtUSD(tx.amount)})`,
      tenantId: 'session',
    });
    await queryClient.invalidateQueries({ queryKey: FINANCES_KEY });
    setDrawer({ kind: 'closed' });
  };

  const deleteTx = async (id: string) => {
    const tx = fin.ledger.find(t => t.id === id);
    await clientFetch(`/finances/ledger/${id}`, { method: 'DELETE' });
    emitAudit({ action:'delete', entity:'ledger', entityId:id, label:`Ledger entry "${tx?.source??id}" deleted`, tenantId:'session' });
    await queryClient.invalidateQueries({ queryKey: FINANCES_KEY });
    setDrawer({ kind: 'closed' });
  };

  const setRate = async (rate: number) => {
    await clientFetch('/finances/tax-rate', { method:'PATCH', body:JSON.stringify({ taxRate:rate }) });
    await queryClient.invalidateQueries({ queryKey: FINANCES_KEY });
  };

  const toggleQuarter = async (qid: string, recommended: number) => {
    const q = fin.taxPayments.find(p => p.id === qid);
    await clientFetch(`/finances/tax-payments/${qid}/paid`, { method:'PATCH', body:JSON.stringify({ paidAmount: String(recommended) }) });
    emitAudit({ action:'toggle', entity:'ledger', entityId:qid, label:`${q?.label??'Quarter'} marked ${q?.paid?'unpaid':'paid'}`, tenantId:'session' });
    await queryClient.invalidateQueries({ queryKey: FINANCES_KEY });
  };

  const editingTx = drawer.kind === 'edit' ? fin.ledger.find(t=>t.id===drawer.id)??null : null;

  return (
    <div>
      <SectionHeader
        title="Finances"
        desc="Income and expense ledger with accounting-ready category tags, revenue trend, and quarterly estimated-tax set-asides."
        actions={
          <div className="lic-toolbar">
            <button type="button" className="btn" onClick={()=>setDrawer({kind:'new',defaultType:'income'})}><Plus size={15}/>Log income</button>
            <button type="button" className="btn primary" onClick={()=>setDrawer({kind:'new',defaultType:'expense'})}><Plus size={15}/>Log expense</button>
          </div>
        }
      />

      <div className="dash-grid" style={{ marginBottom:'var(--gap-grid)' }}>
        {kpis.map(k=>(
          <div key={k.label} className="col-3">
            <div className="card kpi">
              <span className="kpi-label">{k.label}</span>
              <div className="kpi-value" style={{ margin:'10px 0 4px' }}>{k.value}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="col-7">
          <Card title="Revenue vs. expenses" desc="Last 6 months · current month from ledger"
            headRight={
              <div style={{ display:'flex', gap:14, fontSize:11.5, color:'var(--ink-2)' }}>
                <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:9,height:9,borderRadius:2,background:'var(--primary)',display:'inline-block' }}/>Revenue</span>
                <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:9,height:9,borderRadius:2,background:'color-mix(in srgb,var(--primary) 28%,var(--border-strong))',display:'inline-block' }}/>Expenses</span>
              </div>
            }>
            <BarChart months={months}/>
            <div style={{ display:'flex', marginTop:16, paddingTop:14, borderTop:'1px solid var(--border)' }}>
              {([['Revenue (6 mo.)',totals.rev],['Expenses (6 mo.)',totals.exp],['Net (6 mo.)',totals.net]] as [string,number][]).map(([label,value],i)=>(
                <div key={label} style={{ flex:1, paddingLeft:i?18:0, borderLeft:i?'1px solid var(--border)':'none' }}>
                  <div style={{ fontSize:11.5, color:'var(--ink-3)' }}>{label}</div>
                  <div className="mono" style={{ fontSize:18, fontWeight:600, marginTop:3 }}>{fmtUSD(value)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="col-5">
          <Card title="Expenses by category" desc={`Tagged for accounting · ${fin.currentMonth} · ${fmtUSD(cats.reduce((a,c)=>a+c.amount,0))}`}>
            {cats.length===0 ? (
              <EmptyState Icon={DollarSign} title="No expenses logged" desc="Log an expense and tag its category to build the breakdown."/>
            ) : <ExpenseBreakdown categories={cats}/>}
          </Card>
        </div>
      </div>

      <div className="dash-grid" style={{ marginTop:'var(--gap-grid)' }}>
        <div className="col-7">
          <Card title="Ledger" desc={`${fin.currentMonth} · click an entry to edit`}>
            {ledgerSorted.length===0 ? (
              <EmptyState Icon={DollarSign} title="No entries yet" desc="Log income and expenses to track cash flow and classify spending."/>
            ) : (
              <table className="tbl">
                <thead><tr><th>Date</th><th>Source</th><th>Category</th><th style={{ textAlign:'right' }}>Amount</th></tr></thead>
                <tbody>
                  {ledgerSorted.map(t=>(
                    <tr key={t.id} className="row" style={{ cursor:'pointer' }} onClick={()=>setDrawer({kind:'edit',id:t.id})}>
                      <td className="mono" style={{ color:'var(--ink-3)' }}>{t.date?t.date.slice(5):'—'}</td>
                      <td className="name">
                        <span className="type-dot" style={{ background:t.type==='income'?'var(--ok)':'var(--ink-3)' }}/>
                        {t.source||'—'}
                        {t.note&&<span style={{ color:'var(--ink-3)',fontWeight:400 }}> · {t.note}</span>}
                      </td>
                      <td><span className="tag">{t.category}</span></td>
                      <td className="num"><span className={t.type==='income'?'amt-in':'amt-out'}>{t.type==='income'?'+':'−'}{fmtUSD(t.amount)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <div className="col-5">
          <Card title="Estimated taxes" desc="Set aside a share of net income for quarterly estimates"
            headRight={
              <div className="rate-seg">
                {TAX_RATE_OPTS.map(r=>(
                  <button key={r} type="button" className={fin.taxRate===r?'on':''} onClick={()=>setRate(r)}>
                    {Math.round(r*100)}%
                  </button>
                ))}
              </div>
            }>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0 14px', borderBottom:'1px solid var(--border)', marginBottom:6 }}>
              <span style={{ fontSize:12.5, color:'var(--ink-2)' }}>YTD net income</span>
              <span className="mono" style={{ fontWeight:600 }}>{fmtUSD(ytdNet)}</span>
            </div>
            {fin.taxPayments.map(q=>{
              const net  = finQuarterNet(fin, q.label);
              const rec  = Math.max(0, Math.round(net*fin.taxRate));
              const noNet = net <= 0;
              return (
                <div key={q.id} className="tax-row">
                  <div>
                    <div className="tax-q">{q.label}</div>
                    <div className="tax-meta">due {fmtDate(q.due)}</div>
                  </div>
                  <div className="tax-amt">
                    <div className="tax-rec">{noNet?'—':fmtUSD(rec)}</div>
                    <div className="tax-sub">{q.paid?`paid ${fmtUSD(q.paidAmount)}`:noNet?'no net yet':'recommended'}</div>
                  </div>
                  {!noNet&&(
                    <button type="button" className={`tax-mark${q.paid?' paid':''}`} onClick={()=>toggleQuarter(q.id,rec)}>
                      {q.paid?'✓ Paid':'Mark paid'}
                    </button>
                  )}
                </div>
              );
            })}
            <div className="cycle-meter">Estimate only — confirm with your accountant. Federal + self-employment; state varies.</div>
          </Card>
        </div>
      </div>

      {drawer.kind!=='closed'&&(
        <TxDrawer key={drawer.kind==='edit'?drawer.id:`__new__:${drawer.kind==='new'?drawer.defaultType:''}`}
          tx={editingTx} defaultType={drawer.kind==='new'?drawer.defaultType:undefined}
          onSave={saveTx} onDelete={deleteTx} onClose={()=>setDrawer({kind:'closed'})}/>
      )}
    </div>
  );
}
