/* Finances workspace — editable income/expense ledger with category tags,
   derived revenue-vs-expense trend + expense breakdown, and quarterly
   estimated-tax set-asides. Shares the persisted finance store in store.jsx. */
const { useState: useStateF } = React;

const RATE_OPTS = [0.22, 0.27, 0.30];

function FinancesInner() {
  const [fin, setFin] = useFinances();
  const [openTx, setOpenTx] = useStateF(null);   // tx id, or "__new__:expense" / "__new__:income"

  const mtd = finMTD(fin);
  const months = finMonths(fin);
  const categories = finExpenseByCategory(fin);
  const max = Math.max(...months.flatMap(m => [m.rev, m.exp]));
  const totalExp = categories.reduce((a, c) => a + c.amount, 0);
  const ytdNet = finYTDNet(fin);

  const ledgerSorted = [...fin.ledger].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const saveTx = (tx) => {
    setFin(prev => {
      const i = prev.ledger.findIndex(t => t.id === tx.id);
      const ledger = i === -1 ? [...prev.ledger, tx] : prev.ledger.map(t => t.id === tx.id ? tx : t);
      return { ...prev, ledger };
    });
    setOpenTx(null);
  };
  const delTx = (id) => { setFin(prev => ({ ...prev, ledger: prev.ledger.filter(t => t.id !== id) })); setOpenTx(null); };
  const setRate = (r) => setFin(prev => ({ ...prev, taxRate: r }));
  const toggleQuarter = (qid, rec) => setFin(prev => ({
    ...prev,
    taxPayments: prev.taxPayments.map(q => q.id === qid ? { ...q, paid: !q.paid, paidAmount: !q.paid ? rec : 0 } : q),
  }));

  const editingTx = openTx && !openTx.startsWith("__new__") ? fin.ledger.find(t => t.id === openTx) : null;
  const newType = openTx && openTx.startsWith("__new__") ? openTx.split(":")[1] : null;

  const kpis = [
    { label: "MTD revenue", value: fmtUSD(mtd.rev), sub: `${fin.ledger.filter(t => t.type === "income").length} income entries` },
    { label: "MTD expenses", value: fmtUSD(mtd.exp), sub: `${fin.ledger.filter(t => t.type === "expense").length} expense entries` },
    { label: "MTD net", value: fmtUSD(mtd.net), sub: `${Math.round((mtd.net / mtd.rev) * 100)}% margin` },
    { label: "Set aside (YTD)", value: fmtUSD(Math.round(ytdNet * fin.taxRate)), sub: `at ${Math.round(fin.taxRate * 100)}% of net` },
  ];

  return (
    <div>
      <SectionHead title="Finances"
        desc="Income and expense ledger with accounting-ready category tags, revenue trend, and quarterly estimated-tax set-asides."
        actions={
          <div className="lic-toolbar">
            <button className="btn" onClick={() => setOpenTx("__new__:income")}><Icon.plus size={15}/>Log income</button>
            <button className="btn primary" onClick={() => setOpenTx("__new__:expense")}><Icon.plus size={15}/>Log expense</button>
          </div>
        }/>

      <div className="grid" style={{ marginBottom: "var(--gap-grid)" }}>
        {kpis.map(k => (
          <div className="col-3" key={k.label}><Card className="kpi">
            <span className="kpi-label">{k.label}</span>
            <div className="kpi-value" style={{ margin: "10px 0 4px" }}>{k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
          </Card></div>
        ))}
      </div>

      <div className="grid">
        <div className="col-7"><Card title="Revenue vs. expenses" desc="Last 6 months · current month from ledger"
          headRight={<div style={{ display: "flex", gap: 14, fontSize: 11.5, color: "var(--ink-2)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--primary)" }}></span>Revenue</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "color-mix(in srgb,var(--primary) 28%,var(--border-strong))" }}></span>Expenses</span>
          </div>}>
          <BarChart months={months} max={max}/>
          <div style={{ display: "flex", gap: 0, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            {[["Revenue (6 mo.)", months.reduce((a, m) => a + m.rev, 0)], ["Expenses (6 mo.)", months.reduce((a, m) => a + m.exp, 0)], ["Net (6 mo.)", months.reduce((a, m) => a + m.rev - m.exp, 0)]].map(([l, v], i) => (
              <div key={l} style={{ flex: 1, paddingLeft: i ? 18 : 0, borderLeft: i ? "1px solid var(--border)" : "none" }}>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{l}</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600, marginTop: 3 }}>{fmtUSD(v)}</div>
              </div>
            ))}
          </div>
        </Card></div>
        <div className="col-5"><Card title="Expenses by category" desc={`Tagged for accounting · ${fin.currentMonth} · ${fmtUSD(totalExp)}`}>
          {categories.length === 0
            ? <EmptyState icon={Icon.finances} title="No expenses logged" desc="Log an expense and tag its category to build the breakdown."/>
            : <ExpenseBreakdown categories={categories} total={totalExp} hideHeader={true}/>}
        </Card></div>
      </div>

      <div className="grid" style={{ marginTop: "var(--gap-grid)" }}>
        <div className="col-7"><Card title="Ledger" desc={`${fin.currentMonth} 2026 · click an entry to edit`}>
          {ledgerSorted.length === 0 ? (
            <EmptyState icon={Icon.dollar} title="No entries yet" desc="Log income and expenses to track cash flow and classify spending." action="Log expense"/>
          ) : (
            <table className="tbl">
              <thead><tr><th>Date</th><th>Source</th><th>Category</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead>
              <tbody>
                {ledgerSorted.map(t => (
                  <tr className="row" key={t.id} style={{ cursor: "pointer" }} onClick={() => setOpenTx(t.id)}>
                    <td className="mono" style={{ color: "var(--ink-3)" }}>{t.date ? t.date.slice(5) : "—"}</td>
                    <td className="name"><span className="type-dot" style={{ background: t.type === "income" ? "var(--ok)" : "var(--ink-3)" }}></span>{t.source || "—"}{t.note && <span style={{ color: "var(--ink-3)", fontWeight: 400 }}> · {t.note}</span>}</td>
                    <td><span className="tag">{t.category}</span></td>
                    <td className="num"><span className={t.type === "income" ? "amt-in" : "amt-out"}>{t.type === "income" ? "+" : "−"}{fmtUSD(t.amount)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card></div>

        <div className="col-5"><Card title="Estimated taxes"
          desc="Set aside a share of net income for quarterly estimates"
          headRight={<div className="rate-seg">
            {RATE_OPTS.map(r => <button key={r} className={fin.taxRate === r ? "on" : ""} onClick={() => setRate(r)}>{Math.round(r * 100)}%</button>)}
          </div>}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0 14px", borderBottom: "1px solid var(--border)", marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>YTD net income</span>
            <span className="mono" style={{ fontWeight: 600 }}>{fmtUSD(ytdNet)}</span>
          </div>
          {fin.taxPayments.map(q => {
            const net = finQuarterNet(fin, q.label);
            const rec = Math.max(0, Math.round(net * fin.taxRate));
            const future = net <= 0;
            return (
              <div className="tax-row" key={q.id}>
                <div>
                  <div className="tax-q">{q.label}</div>
                  <div className="tax-meta">due {fmtDate(q.due)}</div>
                </div>
                <div className="tax-amt">
                  <div className="tax-rec">{future ? "—" : fmtUSD(rec)}</div>
                  <div className="tax-sub">{q.paid ? `paid ${fmtUSD(q.paidAmount)}` : future ? "no net yet" : "recommended"}</div>
                </div>
                {!future && <button className={"tax-mark" + (q.paid ? " paid" : "")} onClick={() => toggleQuarter(q.id, rec)}>
                  {q.paid ? "✓ Paid" : "Mark paid"}
                </button>}
              </div>
            );
          })}
          <div className="cycle-meter">Estimate only — confirm with your accountant. Federal + self-employment; state varies.</div>
        </Card></div>
      </div>

      {(editingTx || newType) && <TxDrawer key={openTx} tx={editingTx} newType={newType} onSave={saveTx} onDelete={delTx} onClose={() => setOpenTx(null)}/>}
    </div>
  );
}

/* ---------------- Transaction drawer ---------------- */
function blankTx(type) {
  return { id: uid(), date: "2026-06-01", type: type || "expense",
    category: type === "income" ? "Platform payout" : "Insurance", source: "", amount: 0, note: "" };
}
function TxDrawer({ tx, newType, onSave, onDelete, onClose }) {
  const isNew = !tx;
  const [d, setD] = useStateF(() => tx ? { ...tx } : blankTx(newType));
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const cats = d.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const setType = (t) => setD(p => ({ ...p, type: t, category: (t === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0] }));
  const canSave = d.amount > 0 && !!d.source.trim();

  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <aside className="drawer" role="dialog" aria-label="Transaction">
        <header className="drawer-head">
          <div style={{ flex: 1 }}>
            <div className="drawer-eyebrow">{isNew ? "Log entry" : "Edit entry"}</div>
            <div className="drawer-title"><span style={{ fontSize: 18 }}>{d.source || (d.type === "income" ? "New income" : "New expense")}</span></div>
            <div className="drawer-badges">
              <span className={"pill " + (d.type === "income" ? "ok" : "idle")}><span className="dot"></span>{d.type === "income" ? "Income" : "Expense"}</span>
              <span className="mini-badge">{d.category}</span>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close" style={{ flex: "none" }}><Icon.plus size={18} sw={2} style={{ transform: "rotate(45deg)" }}/></button>
        </header>

        <div className="drawer-body">
          <div className="dgroup"><div className="dgroup-head"><span className="dgroup-title">Type</span></div>
            <div className="seg-status" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <button className={d.type === "income" ? "on ok" : ""} onClick={() => setType("income")}><span className="dot" style={{ background: "var(--ok)" }}></span>Income</button>
              <button className={d.type === "expense" ? "on idle" : ""} onClick={() => setType("expense")}><span className="dot" style={{ background: "var(--ink-3)" }}></span>Expense</button>
            </div>
          </div>

          <div className="dgroup"><div className="dgroup-head"><span className="dgroup-title">Details</span></div>
            <div className="field-grid">
              <div className="field"><label>Date</label><input className="input" type="date" value={d.date} onChange={e => set("date", e.target.value)}/></div>
              <div className="field"><label>Amount (USD)</label><input className="input mono" type="number" min="0" value={d.amount} onChange={e => set("amount", Number(e.target.value) || 0)}/></div>
              <div className="field full"><label>{d.type === "income" ? "Source" : "Vendor"}</label><input className="input" value={d.source} onChange={e => set("source", e.target.value)} placeholder={d.type === "income" ? "e.g. Teladoc Health" : "e.g. MedPro Group"}/></div>
              <div className="field full"><label>Category</label>
                <select className="input" value={d.category} onChange={e => set("category", e.target.value)}>{cats.map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="field full"><label>Note</label><input className="input" value={d.note} onChange={e => set("note", e.target.value)} placeholder="optional"/></div>
            </div>
          </div>
        </div>

        <footer className="drawer-foot">
          {!isNew && <button className="btn danger" onClick={() => onDelete(d.id)}>Delete</button>}
          <div className="spacer"></div>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!canSave} style={!canSave ? { opacity: .5, cursor: "not-allowed" } : undefined} onClick={() => canSave && onSave(d)}>{isNew ? "Add entry" : "Save changes"}</button>
        </footer>
      </aside>
    </>
  );
}

window.SECTIONS = Object.assign({}, window.SECTIONS, { finances: FinancesInner });
window.FinancesSection = FinancesInner;
