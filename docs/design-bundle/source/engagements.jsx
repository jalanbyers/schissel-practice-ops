/* Engagements workspace — add / modify 1099 contracts & telehealth platforms,
   each with an editable reference doc (terms, onboarding checklist, documents,
   notes). Shares the persisted engagement store in store.jsx. */
const { useState: useStateE } = React;

/* ---------------- Section ---------------- */
function EngagementsSection() {
  const [list, setList] = useEngagements();
  const [openId, setOpenId] = useStateE(null);
  const [query, setQuery] = useStateE("");
  const [filter, setFilter] = useStateE(null);

  const counts = list.reduce((a, e) => (a[e.status] = (a[e.status] || 0) + 1, a), {});

  const save = (obj) => {
    setList(prev => { const i = prev.findIndex(e => e.id === obj.id); if (i === -1) return [...prev, obj]; const n = prev.slice(); n[i] = obj; return n; });
    setOpenId(obj.id);
  };
  const remove = (id) => { setList(prev => prev.filter(e => e.id !== id)); setOpenId(null); };

  const editing = openId && openId !== "__new__" ? list.find(e => e.id === openId) : null;
  const isNew = openId === "__new__";
  const q = query.trim().toLowerCase();
  const order = { active: 0, prospect: 1, hold: 2, ended: 3 };
  const filtered = list
    .filter(e => (!filter || e.status === filter) && (!q || e.name.toLowerCase().includes(q) || (e.model || "").toLowerCase().includes(q)))
    .sort((a, b) => order[a.status] - order[b.status]);

  return (
    <div>
      <SectionHead title="Engagements"
        desc="1099 contracts and telehealth platforms — volume, rate, status, and a living reference doc per engagement."
        actions={
          <div className="lic-toolbar">
            <div className="lic-search"><Icon.search size={15}/><input placeholder="Find an engagement…" value={query} onChange={e => setQuery(e.target.value)}/></div>
            <button className="btn primary" onClick={() => setOpenId("__new__")}><Icon.plus size={15}/>Add engagement</button>
          </div>
        }/>

      <div className="grid" style={{ marginBottom: "var(--gap-grid)" }}>
        {ENG_STATUS_OPTS.map(([k, label, cls]) => (
          <div className="col-3" key={k}>
            <Card className={"kpi stat-card" + (filter === k ? " sel" : "")} onClick={() => setFilter(filter === k ? null : k)}>
              <div className="stat-mini"><span className={"pill " + cls} style={{ padding: "2px 7px" }}><span className="dot"></span>{label}</span></div>
              <div className="kpi-value" style={{ margin: "10px 0 2px" }}>{counts[k] || 0}</div>
              <div className="kpi-sub">{filter === k ? "Filtering · tap to clear" : "tap to filter"}</div>
            </Card>
          </div>
        ))}
      </div>

      <div className="grid">
        <div className="col-12"><Card title="Roster" desc={filter ? `Filtered: ${ENG_STATUS_OPTS.find(o => o[0] === filter)[1]}` : "Click any engagement to open its reference doc · active first"}>
          {filtered.length === 0 ? (
            <EmptyState icon={Icon.engagements} title="No matching engagements" desc="Add 1099 contracts and telehealth platforms to track volume, rate, and onboarding." action="Add engagement"/>
          ) : (
            <table className="tbl">
              <thead><tr><th>Engagement</th><th>Model</th><th>Volume</th><th>Rate</th><th>Onboarding</th><th style={{ textAlign: "right" }}>Status</th></tr></thead>
              <tbody>
                {filtered.map(e => {
                  const done = e.requirements.filter(r => r.done).length;
                  return (
                    <tr className="row" key={e.id} style={{ cursor: "pointer" }} onClick={() => setOpenId(e.id)}>
                      <td className="name"><div style={{ display: "flex", alignItems: "center", gap: 11 }}><span className="eng-logo" style={{ width: 30, height: 30, fontSize: 12 }}>{e.name.slice(0, 2).toUpperCase()}</span>{e.name}</div></td>
                      <td>{e.model || "—"}</td>
                      <td className="mono">{e.volume || "—"}</td>
                      <td className="mono">{e.rate || "—"}</td>
                      <td className="mono" style={{ color: "var(--ink-3)", fontSize: 12 }}>{e.requirements.length ? `${done}/${e.requirements.length}` : "—"}</td>
                      <td style={{ textAlign: "right" }}><StatusPill map={ENG_STATUS} status={e.status}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card></div>
      </div>

      {(editing || isNew) && <EngagementDrawer key={openId} eng={editing} isNew={isNew} onSave={save} onDelete={remove} onClose={() => setOpenId(null)}/>}
    </div>
  );
}

/* ---------------- Drawer ---------------- */
function blankEng() {
  return { id: uid(), name: "", model: "Async visits", volume: "", rate: "", status: "prospect",
    startDate: "", contact: "", portalUrl: "", payTerms: "", requirements: [], documents: [], notes: "" };
}
function EngagementDrawer({ eng, isNew, onSave, onDelete, onClose }) {
  const [d, setD] = useStateE(() => eng ? JSON.parse(JSON.stringify(eng)) : blankEng());
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const canSave = !!d.name.trim();

  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <aside className="drawer" role="dialog" aria-label="Engagement details">
        <header className="drawer-head">
          <div style={{ flex: 1 }}>
            <div className="drawer-eyebrow">{isNew ? "Add engagement" : "Engagement"}</div>
            <div className="drawer-title"><span style={{ fontSize: 18 }}>{d.name || "New engagement"}</span></div>
            <div className="drawer-badges">
              <StatusPill map={ENG_STATUS} status={d.status}/>
              {d.model && <span className="mini-badge">{d.model}</span>}
              {d.rate && <span className="mini-badge">{d.rate}</span>}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close" style={{ flex: "none" }}><Icon.plus size={18} sw={2} style={{ transform: "rotate(45deg)" }}/></button>
        </header>

        <div className="drawer-body">
          <div className="dgroup"><div className="dgroup-head"><span className="dgroup-title">Status</span></div>
            <SegStatus opts={ENG_STATUS_OPTS} value={d.status} onChange={v => set("status", v)}/></div>

          <div className="dgroup"><div className="dgroup-head"><span className="dgroup-title">Key facts</span></div>
            <div className="field-grid">
              <div className="field full"><label>Engagement name</label><input className="input" value={d.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Teladoc Health"/></div>
              <div className="field"><label>Model</label>
                <select className="input" value={d.model} onChange={e => set("model", e.target.value)}>{ENG_MODELS.map(m => <option key={m}>{m}</option>)}</select></div>
              <div className="field"><label>Status started</label><input className="input" type="date" value={d.startDate} onChange={e => set("startDate", e.target.value)}/></div>
              <div className="field"><label>Volume</label><input className="input" value={d.volume} onChange={e => set("volume", e.target.value)} placeholder="e.g. 62 visits MTD"/></div>
              <div className="field"><label>Rate</label><input className="input" value={d.rate} onChange={e => set("rate", e.target.value)} placeholder="e.g. $32 / visit"/></div>
              <div className="field"><label>Payment terms</label><input className="input" value={d.payTerms} onChange={e => set("payTerms", e.target.value)} placeholder="e.g. Net 15 · biweekly ACH"/></div>
              <div className="field"><label>Contact</label><input className="input" value={d.contact} onChange={e => set("contact", e.target.value)} placeholder="account manager"/></div>
              <div className="field full"><label>Portal / website</label><input className="input" value={d.portalUrl} onChange={e => set("portalUrl", e.target.value)} placeholder="e.g. provider.platform.com"/></div>
            </div>
          </div>

          <ReqSection title="Onboarding requirements" items={d.requirements} onChange={v => set("requirements", v)}
            empty="Add onboarding steps — platform credentialing, malpractice COI, direct deposit, training…"/>
          <DocSection items={d.documents} onChange={v => set("documents", v)} empty="Link contracts, rate exhibits, portal logins…"/>

          <div className="dgroup"><div className="dgroup-head"><span className="dgroup-title">Notes</span></div>
            <textarea className="textarea" value={d.notes} placeholder="Payout schedule, volume trends, contacts, renewal terms…" onChange={e => set("notes", e.target.value)}></textarea></div>
        </div>

        <footer className="drawer-foot">
          {!isNew && <button className="btn danger" onClick={() => onDelete(d.id)}>Delete</button>}
          <div className="spacer"></div>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!canSave} style={!canSave ? { opacity: .5, cursor: "not-allowed" } : undefined} onClick={() => canSave && onSave(d)}>{isNew ? "Add engagement" : "Save changes"}</button>
        </footer>
      </aside>
    </>
  );
}

window.SECTIONS = Object.assign({}, window.SECTIONS, { engagements: EngagementsSection });
window.EngagementsSection = EngagementsSection;
