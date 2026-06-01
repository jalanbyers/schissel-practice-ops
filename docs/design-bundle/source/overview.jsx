/* Overview screen for Schissel Health Status.
   Cards: KpiRow, LicenseStatusCard, CredentialingTable, FinancesSnapshot
   (BarChart + ExpenseBreakdown), ActiveEngagements, ComplianceChecklist. */

const EXP_COLORS = ["var(--primary)", "#3a9d9d", "#66b8b8", "#93cccc", "#bfe0e0", "#dceeee"];

/* Geographic tile-grid positions [code, row, col] — 50 states + DC,
   placed to approximate their real location on a US map. */
const US_GRID = [
  ["AK",1,1], ["ME",1,11],
  ["VT",2,10], ["NH",2,11],
  ["WA",3,1], ["ID",3,2], ["MT",3,3], ["ND",3,4], ["MN",3,5], ["WI",3,6], ["MI",3,8], ["NY",3,9], ["MA",3,11],
  ["OR",4,1], ["NV",4,2], ["WY",4,3], ["SD",4,4], ["IA",4,5], ["IL",4,6], ["IN",4,7], ["OH",4,8], ["PA",4,9], ["NJ",4,10], ["CT",4,11],
  ["CA",5,1], ["UT",5,2], ["CO",5,3], ["NE",5,4], ["MO",5,5], ["KY",5,6], ["WV",5,7], ["VA",5,8], ["MD",5,9], ["DE",5,10], ["RI",5,11],
  ["AZ",6,2], ["NM",6,3], ["KS",6,4], ["AR",6,5], ["TN",6,6], ["NC",6,8], ["DC",6,9],
  ["OK",7,4], ["LA",7,5], ["MS",7,6], ["AL",7,7], ["GA",7,8], ["SC",7,9],
  ["HI",8,1], ["TX",8,4], ["FL",8,8],
];
const US_NAMES = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",
  DE:"Delaware",DC:"District of Columbia",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",
  IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",
  MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",
  NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",
  OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",
  TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",
  WI:"Wisconsin",WY:"Wyoming",
};

/* ---- 1. KPI row ---- */
function KpiRow({ kpis, onNavigate }) {
  const icons = { licenses: Icon.licensing, engagements: Icon.engagements, revenue: Icon.dollar, tasks: Icon.compliance };
  const arrows = { up: "↑", down: "↓", flat: "→" };
  return kpis.map((k) => {
    const Ico = icons[k.id] || Icon.overview;
    return (
      <div key={k.id} className="col-3">
        <Card className="kpi" onClick={() => onNavigate(k.section)}>
          <div className="kpi-top">
            <span className="kpi-label">{k.label}</span>
            <span className="kpi-ico"><Ico size={17}/></span>
          </div>
          <div className="kpi-value">{k.value}</div>
          <div className="kpi-foot">
            <span className={"trend " + k.trend}>{arrows[k.trend]} {k.trendLabel}</span>
            <span className="kpi-sub">{k.sub}</span>
          </div>
        </Card>
      </div>
    );
  });
}

/* ---- 2. Licensing ---- */
function LicenseStatusCard({ states, mode, onNavigate }) {
  const counts = states.reduce((a, s) => (a[s.status] = (a[s.status]||0)+1, a), {});
  const imlcCount = states.filter(s => s.imlc).length;
  const head = (
    <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
      {imlcCount} IMLC-eligible
    </span>
  );
  return (
    <div className="col-7">
      <Card title="Multi-state licensing"
        desc={`${counts.active||0} active · ${counts.progress||0} in progress · ${counts.expiring||0} expiring soon · 50 states + DC`}
        cta="View licensing" onClick={() => onNavigate("licensing")} headRight={head}>
        {mode === "list" ? <LicenseList states={states}/> : <LicenseTiles states={states}/>}
        <div className="legend">
          {[["ok","Active"],["info","In progress"],["warn","Expiring ≤90d"],["idle","Not licensed"]].map(([c,l]) => (
            <span className="legend-item" key={c}><span className="legend-sw" style={{background:`var(--${c==='ok'?'ok':c==='info'?'info':c==='warn'?'warn':'border-strong'})`}}></span>{l}</span>
          ))}
          <span className="legend-item" style={{marginLeft:"auto"}}><span style={{width:8,height:8,borderRadius:"50%",background:"var(--primary)"}}></span>IMLC-eligible</span>
        </div>
      </Card>
    </div>
  );
}
function LicenseTiles({ states, onSelect }) {
  const by = states.reduce((a, s) => (a[s.code] = s, a), {});
  return (
    <div className="tilemap">
      {US_GRID.map(([code, r, c]) => {
        const s = by[code] || { code, name: US_NAMES[code] || code, status: "none", date: null, imlc: false };
        const meta = STATE_STATUS[s.status];
        const exp = s.expires || s.date;
        const sub = s.status === "none" ? "" : (exp && exp.includes("-") ? exp.slice(5) : (s.status === "progress" ? "•••" : ""));
        return (
          <div key={code} className={`tile mini s-${s.status} ${s.home ? "home" : ""}`}
            style={{ gridColumn: c, gridRow: r }}
            onClick={onSelect ? () => onSelect(code) : undefined}
            title={`${US_NAMES[code] || s.name} — ${meta.label}${exp ? " · " + exp : ""}${s.imlc ? " · IMLC-eligible" : ""}`}>
            {s.imlc && <span className="imlc-dot"></span>}
            <span className="tile-code">{code}</span>
            {sub && <span className="tile-sub">{sub}</span>}
          </div>
        );
      })}
    </div>
  );
}
function LicenseList({ states }) {
  const order = { expiring:0, progress:1, active:2, none:3 };
  const sorted = [...states].sort((a,b)=>order[a.status]-order[b.status]);
  return (
    <table className="tbl">
      <thead><tr><th>State</th><th>Status</th><th style={{textAlign:"right"}}>Renewal / note</th></tr></thead>
      <tbody>
        {sorted.map((s) => (
          <tr className="row" key={s.code}>
            <td className="name"><span className="mono">{s.code}</span> · {s.name} {s.imlc && <span className="tag">IMLC</span>}</td>
            <td><StatusPill map={STATE_STATUS} status={s.status}/></td>
            <td className="num">{s.status==="none" ? "—" : (s.expires || s.date || "—")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---- 3. Credentialing ---- */
function CredentialingTable({ payers, onNavigate, empty }) {
  const approved = payers.filter(p=>p.status==="approved").length;
  return (
    <div className="col-5">
      <Card title="Credentialing & payer enrollment"
        desc={empty ? "No payers added yet" : `${approved} approved · ${payers.length-approved} in flight`}
        cta="View credentialing" onClick={() => onNavigate("credentialing")}>
        {empty ? (
          <EmptyState icon={Icon.credentialing} title="No enrollments tracked"
            desc="Add payers and telehealth platforms to track enrollment from submission through approval."
            action="Add payer"/>
        ) : (
          <table className="tbl">
            <thead><tr><th>Payer / platform</th><th>Status</th><th style={{textAlign:"right"}}>Updated</th></tr></thead>
            <tbody>
              {payers.map((p) => (
                <tr className="row" key={p.name}>
                  <td className="name">{p.name}<div style={{fontSize:11,color:"var(--ink-3)",fontWeight:400}}>{p.type}</div></td>
                  <td><StatusPill map={PAYER_STATUS} status={p.status}/></td>
                  <td className="num" style={{color:"var(--ink-3)"}}>{p.date ? p.date.slice(5) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

/* ---- 4. Finances ---- */
function FinancesSnapshot({ finances, onNavigate }) {
  const months = finMonths(finances);
  const categories = finExpenseByCategory(finances);
  const max = Math.max(...months.flatMap(m => [m.rev, m.exp]));
  const totalExp = categories.reduce((a,c)=>a+c.amount,0);
  return (
    <div className="col-7">
      <Card title="Finances" desc="Revenue vs. expenses · last 6 months"
        cta="View finances" onClick={() => onNavigate("finances")}
        headRight={<div style={{display:"flex",gap:14,fontSize:11.5,color:"var(--ink-2)"}}>
          <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:9,height:9,borderRadius:2,background:"var(--primary)"}}></span>Revenue</span>
          <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:9,height:9,borderRadius:2,background:"color-mix(in srgb,var(--primary) 28%,var(--border-strong))"}}></span>Expenses</span>
        </div>}>
        <BarChart months={months} max={max}/>
        <ExpenseBreakdown categories={categories} total={totalExp}/>
      </Card>
    </div>
  );
}
function BarChart({ months, max }) {
  return (
    <div className="chart">
      {months.map((m) => (
        <div className={"bar-col" + (m.partial ? " partial" : "")} key={m.m}>
          <div className="bar-pair">
            <div className="bar rev" style={{height:`${(m.rev/max)*100}%`}} title={`${m.m} revenue ${fmtUSD(m.rev)}`}></div>
            <div className="bar exp" style={{height:`${(m.exp/max)*100}%`}} title={`${m.m} expenses ${fmtUSD(m.exp)}`}></div>
          </div>
          <div className="bar-m">{m.m}{m.partial?"*":""}</div>
        </div>
      ))}
    </div>
  );
}
function ExpenseBreakdown({ categories, total, hideHeader }) {
  return (
    <div style={hideHeader ? {} : {marginTop:18,paddingTop:16,borderTop:"1px solid var(--border)"}}>
      {!hideHeader && <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:8}}>
        <span style={{fontSize:12.5,fontWeight:600}}>Expenses by category</span>
        <span className="mono" style={{fontSize:11.5,color:"var(--ink-3)"}}>this period · {fmtUSD(total)}</span>
      </div>}
      <div className="exp-stack">
        {categories.map((c,i)=>(<div key={c.tag} className="exp-seg" style={{width:`${(c.amount/total)*100}%`,background:EXP_COLORS[i%EXP_COLORS.length]}} title={`${c.label} ${fmtUSD(c.amount)}`}></div>))}
      </div>
      <div className="exp-list">
        {categories.map((c,i)=>(
          <div className="exp-row" key={c.tag}>
            <span className="exp-dot" style={{background:EXP_COLORS[i%EXP_COLORS.length]}}></span>
            <span className="tag">{c.tag}</span>
            <span style={{color:"var(--ink-2)"}}>{c.label}</span>
            <span className="exp-amt">{fmtUSD(c.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- 5. Engagements ---- */
function ActiveEngagements({ engagements, onNavigate, empty }) {
  return (
    <div className="col-5">
      <Card title="Active engagements" desc={empty ? "No engagements yet" : `${engagements.filter(e=>e.status==="active").length} active 1099 contracts`}
        cta="View engagements" onClick={() => onNavigate("engagements")}>
        {empty ? (
          <EmptyState icon={Icon.engagements} title="No engagements yet"
            desc="Track 1099 contracts and telehealth platforms with their visit volume, rate, and status."
            action="Add engagement"/>
        ) : engagements.map((e) => (
          <div className="eng-row" key={e.name}>
            <div className="eng-logo">{e.name.slice(0,2).toUpperCase()}</div>
            <div>
              <div className="eng-name">{e.name}</div>
              <div className="eng-model">{e.model}</div>
            </div>
            <div className="eng-stat" style={{marginLeft:"auto"}}>
              <div className="eng-vol">{e.volume}</div>
              <div className="eng-rate">{e.rate}</div>
            </div>
            <StatusPill map={ENG_STATUS} status={e.status}/>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ---- 6. Compliance checklist ---- */
function ComplianceChecklist({ checklist, onNavigate }) {
  const done = checklist.filter(c=>c.status==="done").length;
  const pct = Math.round((done/checklist.length)*100);
  const soon = (d) => d && d.includes("-") && new Date(d) - new Date("2026-06-01") < 14*864e5;
  const mid = Math.ceil(checklist.length/2);
  const cols = [checklist.slice(0,mid), checklist.slice(mid)];
  return (
    <div className="col-12">
      <Card title="Setup & compliance" desc="Entity, banking, HIPAA and insurance readiness"
        cta="View compliance" onClick={() => onNavigate("compliance")}
        headRight={<div style={{minWidth:200,display:"flex",flexDirection:"column",gap:5}}>
          <div className="progress-wrap"><span className="progress-pct">{pct}%</span><div className="progress"><span style={{width:`${pct}%`}}></span></div></div>
          <span style={{fontSize:11,color:"var(--ink-3)",textAlign:"right"}}>{done} of {checklist.length} complete</span>
        </div>}>
        <div className="grid" style={{gridTemplateColumns:"1fr 1fr",gap:"0 32px"}}>
          {cols.map((col,ci)=>(
            <div className="check-list" key={ci}>
              {col.map((c)=>(
                <div className="check-item" key={c.task}>
                  <span className={"check-box " + c.status}>{c.status==="done" && <Icon.check size={13}/>}{c.status==="progress" && <span style={{fontSize:11,fontWeight:700}}>·</span>}</span>
                  <span className={"check-task " + (c.status==="done"?"done":"")}>{c.task}</span>
                  <span className="check-meta">
                    <span className="tag">{c.group}</span>
                    {c.status!=="done" && <span className={"check-due " + (soon(c.date)?"soon":"")}>{c.date ? "due "+c.date.slice(5) : ""}</span>}
                    {c.status==="done" && <span className="check-due">done</span>}
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

/* ---- Overview assembly ---- */
function Overview({ data, mapMode, showEmpty, onNavigate }) {
  const [licenses] = useLicenses();
  const [payers] = usePayers();
  const [engagements] = useEngagements();
  const [checklist] = useChecklist();
  const [finances] = useFinances();

  const activeLic = licenses.filter(s => s.status === "active").length;
  const progLic = licenses.filter(s => s.status === "progress").length;
  const activeEng = engagements.filter(e => e.status === "active").length;
  const holdEng = engagements.filter(e => e.status === "hold").length;
  const openTasks = checklist.filter(c => c.status !== "done").length;
  const dueSoon = checklist.filter(c => c.status !== "done" && c.date && c.date.includes("-") && daysUntil(c.date) != null && daysUntil(c.date) <= 30).length;
  const months = finMonths(finances);
  const cur = months[months.length - 1] || { rev: 0 };
  const prev = months[months.length - 2];

  const kpiVals = {
    licenses: { value: activeLic, sub: `${progLic} in progress` },
    engagements: { value: activeEng, sub: holdEng ? `${holdEng} on hold` : "all active" },
    revenue: { value: fmtUSD(cur.rev), sub: prev ? `vs ${fmtUSD(prev.rev)} last mo.` : "this month" },
    tasks: { value: openTasks, sub: `${dueSoon} due soon` },
  };
  const kpis = data.kpis.map(k => kpiVals[k.id] ? { ...k, ...kpiVals[k.id] } : k);

  return (
    <div className="grid">
      <KpiRow kpis={kpis} onNavigate={onNavigate}/>
      <LicenseStatusCard states={licenses} mode={mapMode} onNavigate={onNavigate}/>
      <CredentialingTable payers={payers} onNavigate={onNavigate} empty={showEmpty}/>
      <FinancesSnapshot finances={finances} onNavigate={onNavigate}/>
      <ActiveEngagements engagements={engagements} onNavigate={onNavigate} empty={showEmpty}/>
      <ComplianceChecklist checklist={checklist} onNavigate={onNavigate}/>
    </div>
  );
}

Object.assign(window, {
  Overview, KpiRow, LicenseStatusCard, LicenseTiles, LicenseList,
  CredentialingTable, FinancesSnapshot, BarChart, ExpenseBreakdown,
  ActiveEngagements, ComplianceChecklist, US_GRID, US_NAMES,
});
