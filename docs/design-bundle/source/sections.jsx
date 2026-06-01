/* Stub section screens reached by drilling into Overview cards or sidebar nav.
   Each reuses real components so the drill-in feels continuous, with a banner
   noting fuller tooling lands next. */

function SectionHead({ title, desc, actions }) {
  return (
    <div className="sec-head">
      <div>
        <div className="sec-title">{title}</div>
        <div className="sec-desc">{desc}</div>
      </div>
      <div style={{marginLeft:"auto",display:"flex",gap:10}}>{actions}</div>
    </div>
  );
}
function StubBanner({ children }) {
  return <div className="stub-banner"><Icon.arrow size={15}/><span>{children}</span></div>;
}
function PrimaryBtn({ children }) {
  return <button className="empty-btn" style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon.plus size={14}/>{children}</button>;
}

/* ---- Licensing ---- */
function LicensingSection({ data }) {
  const counts = data.states.reduce((a,s)=>(a[s.status]=(a[s.status]||0)+1,a),{});
  return (
    <div>
      <SectionHead title="Licensing" desc="State medical licenses, renewal dates, and IMLC compact eligibility across the practice footprint."
        actions={<PrimaryBtn>Add state</PrimaryBtn>}/>
      <StubBanner>Overview snapshot shown below. Renewal reminders, document storage, and IMLC application tracking arrive in this section next.</StubBanner>
      <div className="grid">
        {[["active","Active",counts.active||0],["progress","In progress",counts.progress||0],["expiring","Expiring soon",counts.expiring||0],["none","Not licensed",counts.none||0]].map(([k,l,v])=>(
          <div className="col-3" key={k}><Card className="kpi"><span className="kpi-label">{l}</span><div className="kpi-value">{v}</div></Card></div>
        ))}
        <div className="col-7"><Card title="Footprint"><LicenseTiles states={data.states}/></Card></div>
        <div className="col-5"><Card title="By renewal date"><LicenseList states={data.states}/></Card></div>
      </div>
    </div>
  );
}

/* ---- Credentialing ---- */
function CredentialingSection({ data }) {
  return (
    <div>
      <SectionHead title="Credentialing & payer enrollment" desc="Track enrollment with government and commercial payers plus telehealth platforms from submission through approval."
        actions={<PrimaryBtn>Add payer</PrimaryBtn>}/>
      <StubBanner>Full pipeline view below. Document checklists, re-credentialing dates, and CAQH attestation reminders land here next.</StubBanner>
      <div className="grid">
        <div className="col-12"><Card>
          <table className="tbl">
            <thead><tr><th>Payer / platform</th><th>Type</th><th>Status</th><th style={{textAlign:"right"}}>Last updated</th></tr></thead>
            <tbody>
              {data.payers.map((p)=>(
                <tr className="row" key={p.name}>
                  <td className="name">{p.name}</td>
                  <td><span className="tag">{p.type}</span></td>
                  <td><StatusPill map={PAYER_STATUS} status={p.status}/></td>
                  <td className="num" style={{color:"var(--ink-3)"}}>{p.date || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card></div>
      </div>
    </div>
  );
}

/* ---- Engagements ---- */
function EngagementsSection() {
  const [engagements] = useEngagements();
  return (
    <div>
      <SectionHead title="Engagements" desc="Active 1099 contracts and telehealth platforms with visit volume, rates, and status."
        actions={<PrimaryBtn>Add engagement</PrimaryBtn>}/>
      <StubBanner>Roster shown below. Per-platform earnings, hours logged, and contract document storage arrive in this section next.</StubBanner>
      <div className="grid">
        <div className="col-12"><Card>
          <table className="tbl">
            <thead><tr><th>Engagement</th><th>Model</th><th>Volume</th><th>Rate</th><th style={{textAlign:"right"}}>Status</th></tr></thead>
            <tbody>
              {engagements.map((e)=>(
                <tr className="row" key={e.id || e.name}>
                  <td className="name"><div style={{display:"flex",alignItems:"center",gap:11}}><span className="eng-logo" style={{width:30,height:30,fontSize:12}}>{e.name.slice(0,2).toUpperCase()}</span>{e.name}</div></td>
                  <td>{e.model}</td>
                  <td className="mono">{e.volume}</td>
                  <td className="mono">{e.rate}</td>
                  <td style={{textAlign:"right"}}><StatusPill map={ENG_STATUS} status={e.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card></div>
      </div>
    </div>
  );
}

/* ---- Finances ---- */
function FinancesSection() {
  const [f] = useFinances();
  const max = Math.max(...f.months.flatMap(m=>[m.rev,m.exp]));
  const totalExp = f.expenseCategories.reduce((a,c)=>a+c.amount,0);
  const ytdRev = f.months.reduce((a,m)=>a+m.rev,0);
  const ytdExp = f.months.reduce((a,m)=>a+m.exp,0);
  const cur = f.months.find(m=>m.partial) || f.months[f.months.length-1];
  return (
    <div>
      <SectionHead title="Finances" desc="Revenue, expenses, and accounting-ready expense classification for the period."
        actions={<PrimaryBtn>Log expense</PrimaryBtn>}/>
      <StubBanner>Snapshot below. Invoice tracking, quarterly estimated-tax set-asides, and 1099 reconciliation arrive here next.</StubBanner>
      <div className="grid">
        {[["Revenue (6 mo.)",fmtUSD(ytdRev)],["Expenses (6 mo.)",fmtUSD(ytdExp)],["Net (6 mo.)",fmtUSD(ytdRev-ytdExp)],["MTD revenue",fmtUSD(cur.rev)]].map(([l,v])=>(
          <div className="col-3" key={l}><Card className="kpi"><span className="kpi-label">{l}</span><div className="kpi-value">{v}</div></Card></div>
        ))}
        <div className="col-7"><Card title="Revenue vs. expenses"><BarChart months={f.months} max={max}/></Card></div>
        <div className="col-5"><Card title="Expenses by category" desc="Tagged for accounting"><ExpenseBreakdown categories={f.expenseCategories} total={totalExp}/></Card></div>
      </div>
    </div>
  );
}

/* ---- Compliance ---- */
function ComplianceSection() {
  const [checklist] = useChecklist();
  const done = checklist.filter(c=>c.status==="done").length;
  const pct = Math.round((done/checklist.length)*100);
  return (
    <div>
      <SectionHead title="Compliance & setup" desc="Entity formation, banking, HIPAA, and insurance readiness for the practice."
        actions={<PrimaryBtn>Add task</PrimaryBtn>}/>
      <StubBanner>Checklist below. Document vault, BAA tracking, and annual HIPAA review scheduling arrive in this section next.</StubBanner>
      <div className="grid">
        <div className="col-12"><Card title="Readiness" headRight={<div style={{minWidth:240}}><div className="progress-wrap"><span className="progress-pct">{pct}%</span><div className="progress"><span style={{width:`${pct}%`}}></span></div></div></div>}>
          <div className="check-list">
            {checklist.map((c)=>(
              <div className="check-item" key={c.id || c.task}>
                <span className={"check-box " + c.status}>{c.status==="done" && <Icon.check size={13}/>}</span>
                <span className={"check-task " + (c.status==="done"?"done":"")}>{c.task}</span>
                <span className="check-meta"><span className="tag">{c.group}</span>{c.status!=="done" && c.date && <span className="check-due">due {c.date.slice(5)}</span>}<StatusPill map={{done:{cls:"ok",label:"Done"},progress:{cls:"warn",label:"In progress"},notstarted:{cls:"idle",label:"Not started"}}} status={c.status}/></span>
              </div>
            ))}
          </div>
        </Card></div>
      </div>
    </div>
  );
}

/* ---- Settings (empty-ish stub) ---- */
function SettingsSection({ data }) {
  return (
    <div>
      <SectionHead title="Settings" desc="Practice profile, notification preferences, and account."/>
      <div className="grid">
        <div className="col-7"><Card title="Practice profile">
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {[["Practice name",data.practice.name],["Legal entity",data.practice.entity],["Home state",data.practice.homeState],["NPI Type 2","On file"]].map(([l,v])=>(
              <div key={l} style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid var(--border)",paddingBottom:12}}>
                <span style={{fontSize:12.5,color:"var(--ink-3)"}}>{l}</span>
                <span style={{fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
        </Card></div>
        <div className="col-5"><Card title="Notifications">
          <EmptyState icon={Icon.bell} title="Nothing configured" desc="Set reminders for license renewals, re-credentialing dates, and compliance task due dates." action="Configure reminders"/>
        </Card></div>
      </div>
    </div>
  );
}

const SECTIONS = {
  licensing: LicensingSection,
  credentialing: CredentialingSection,
  engagements: EngagementsSection,
  finances: FinancesSection,
  compliance: ComplianceSection,
  settings: SettingsSection,
};
Object.assign(window, { SECTIONS, SectionHead, StubBanner, PrimaryBtn });
