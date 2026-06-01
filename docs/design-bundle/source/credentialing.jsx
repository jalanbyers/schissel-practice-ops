/* Credentialing workspace — add / modify payer & platform enrollments, each
   with an editable reference doc (key facts, requirements checklist, reference
   documents, notes). Shares the persisted payer store in store.jsx.
   Replaces the stub window.SECTIONS.credentialing. */
const { useState: useStateC, useEffect: useEffectC } = React;

const PAYER_TYPES = ["Commercial", "Government", "Platform", "Clearinghouse", "Profile", "Other"];

/* ---------------- Section ---------------- */
function CredentialingSection() {
  const [list, setList] = usePayers();
  const [openId, setOpenId] = useStateC(null);   // payer id, or "__new__"
  const [query, setQuery] = useStateC("");
  const [filter, setFilter] = useStateC(null);

  const counts = list.reduce((a, p) => (a[p.status] = (a[p.status] || 0) + 1, a), {});

  const openPayer = (id) => { setOpenId(id); };
  const openAdd = () => setOpenId("__new__");
  const close = () => setOpenId(null);

  const savePayer = (obj) => {
    setList(prev => {
      const i = prev.findIndex(p => p.id === obj.id);
      if (i === -1) return [...prev, obj];
      const next = prev.slice(); next[i] = obj; return next;
    });
    setOpenId(obj.id);
  };
  const removePayer = (id) => { setList(prev => prev.filter(p => p.id !== id)); close(); };

  const editing = openId && openId !== "__new__" ? list.find(p => p.id === openId) : null;
  const isNew = openId === "__new__";

  const q = query.trim().toLowerCase();
  const order = { review: 0, submitted: 1, notstarted: 2, approved: 3 };
  const filtered = list
    .filter(p => (!filter || p.status === filter) && (!q || p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q)))
    .sort((a, b) => order[a.status] - order[b.status]);

  return (
    <div>
      <SectionHead title="Credentialing & payer enrollment"
        desc="Government, commercial, and platform enrollments — each with a living reference doc of requirements and IDs."
        actions={
          <div className="lic-toolbar">
            <div className="lic-search"><Icon.search size={15}/>
              <input placeholder="Find a payer…" value={query} onChange={e => setQuery(e.target.value)}/>
            </div>
            <button className="btn primary" onClick={openAdd}><Icon.plus size={15}/>Add payer</button>
          </div>
        }/>

      <div className="grid" style={{ marginBottom: "var(--gap-grid)" }}>
        {PAYER_STATUS_OPTS.map(([k, label, cls]) => (
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
        <div className="col-12">
          <Card title="Enrollments" desc={filter ? `Filtered: ${PAYER_STATUS_OPTS.find(o => o[0] === filter)[1]}` : "Click any payer to open its reference doc · in-review first"}>
            {filtered.length === 0 ? (
              <EmptyState icon={Icon.credentialing} title="No matching payers"
                desc="Add payers and platforms to track enrollment from submission through approval." action="Add payer"/>
            ) : (
              <table className="tbl">
                <thead><tr><th>Payer / platform</th><th>Type</th><th>Requirements</th><th>Status</th><th style={{ textAlign: "right" }}>Updated</th></tr></thead>
                <tbody>
                  {filtered.map(p => {
                    const done = p.requirements.filter(r => r.done).length;
                    return (
                      <tr className="row" key={p.id} style={{ cursor: "pointer" }} onClick={() => openPayer(p.id)}>
                        <td className="name">{p.name}</td>
                        <td><span className="tag">{p.type}</span></td>
                        <td className="mono" style={{ color: "var(--ink-3)", fontSize: 12 }}>{p.requirements.length ? `${done}/${p.requirements.length} done` : "—"}</td>
                        <td><StatusPill map={PAYER_STATUS} status={p.status}/></td>
                        <td className="num" style={{ color: "var(--ink-3)" }}>{p.date ? fmtDate(p.date) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      </div>

      {(editing || isNew) && (
        <PayerDrawer key={openId} payer={editing} isNew={isNew}
          onSave={savePayer} onDelete={removePayer} onClose={close}/>
      )}
    </div>
  );
}

/* ---------------- Drawer ---------------- */
function blankPayer() {
  return { id: uid(), name: "", type: "Commercial", status: "notstarted", date: "",
    effectiveDate: "", revalidation: "", providerId: "", rep: "", portalUrl: "",
    requirements: [], documents: [], notes: "" };
}

function PayerDrawer({ payer, isNew, onSave, onDelete, onClose }) {
  const [d, setD] = useStateC(() => payer ? JSON.parse(JSON.stringify(payer)) : blankPayer());
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));

  const addReq = () => set("requirements", [...d.requirements, { id: uid(), label: "", done: false }]);
  const updReq = (id, patch) => set("requirements", d.requirements.map(r => r.id === id ? { ...r, ...patch } : r));
  const delReq = (id) => set("requirements", d.requirements.filter(r => r.id !== id));
  const reqDone = d.requirements.filter(r => r.done).length;

  const addDoc = () => set("documents", [...d.documents, { id: uid(), name: "", note: "" }]);
  const updDoc = (id, patch) => set("documents", d.documents.map(x => x.id === id ? { ...x, ...patch } : x));
  const delDoc = (id) => set("documents", d.documents.filter(x => x.id !== id));

  const canSave = !!d.name.trim();

  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <aside className="drawer" role="dialog" aria-label="Payer details">
        <header className="drawer-head">
          <div style={{ flex: 1 }}>
            <div className="drawer-eyebrow">{isNew ? "Add payer / platform" : "Enrollment"}</div>
            <div className="drawer-title">
              <span style={{ fontSize: 18 }}>{d.name || "New payer"}</span>
            </div>
            <div className="drawer-badges">
              <StatusPill map={PAYER_STATUS} status={d.status}/>
              <span className="mini-badge">{d.type}</span>
              {d.providerId && <span className="mini-badge">{d.providerId}</span>}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close" style={{ flex: "none" }}><Icon.plus size={18} sw={2} style={{ transform: "rotate(45deg)" }}/></button>
        </header>

        <div className="drawer-body">
          <div className="dgroup">
            <div className="dgroup-head"><span className="dgroup-title">Status</span></div>
            <div className="seg-status">
              {PAYER_STATUS_OPTS.map(([k, label, cls]) => (
                <button key={k} className={(d.status === k ? "on " + cls : "")} onClick={() => set("status", k)}>
                  <span className="dot" style={{ background: `var(--${cls})` }}></span>{label}
                </button>
              ))}
            </div>
          </div>

          <div className="dgroup">
            <div className="dgroup-head"><span className="dgroup-title">Key facts</span></div>
            <div className="field-grid">
              <div className="field full"><label>Payer / platform name</label>
                <input className="input" value={d.name} onChange={e => set("name", e.target.value)} placeholder="e.g. UnitedHealthcare"/></div>
              <div className="field"><label>Type</label>
                <select className="input" value={d.type} onChange={e => set("type", e.target.value)}>
                  {PAYER_TYPES.map(t => <option key={t}>{t}</option>)}
                </select></div>
              <div className="field"><label>Provider ID / PTAN</label>
                <input className="input mono" value={d.providerId} onChange={e => set("providerId", e.target.value)} placeholder="optional"/></div>
              <div className="field"><label>Last updated</label>
                <input className="input" type="date" value={d.date} onChange={e => set("date", e.target.value)}/></div>
              <div className="field"><label>Effective date</label>
                <input className="input" type="date" value={d.effectiveDate} onChange={e => set("effectiveDate", e.target.value)}/></div>
              <div className="field"><label>Revalidation due</label>
                <input className="input" type="date" value={d.revalidation} onChange={e => set("revalidation", e.target.value)}/></div>
              <div className="field"><label>Network rep / MAC</label>
                <input className="input" value={d.rep} onChange={e => set("rep", e.target.value)} placeholder="optional"/></div>
              <div className="field full"><label>Portal / website</label>
                <input className="input" value={d.portalUrl} onChange={e => set("portalUrl", e.target.value)} placeholder="e.g. uhcprovider.com"/></div>
            </div>
          </div>

          <div className="dgroup">
            <div className="dgroup-head">
              <span className="dgroup-title">Enrollment requirements</span>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{reqDone}/{d.requirements.length} done</span>
              <button className="btn ghost" onClick={addReq}><Icon.plus size={13}/>Add</button>
            </div>
            {d.requirements.length === 0 && <div className="empty-mini">No requirements yet. Add CAQH attestation, W-9, EFT/ERA, contract signature…</div>}
            {d.requirements.map(r => (
              <div className="req-item" key={r.id}>
                <span className={"req-check" + (r.done ? " done" : "")} onClick={() => updReq(r.id, { done: !r.done })}>{r.done && <Icon.check size={13}/>}</span>
                <input className={"req-input" + (r.done ? " done" : "")} value={r.label} placeholder="Describe a requirement…" onChange={e => updReq(r.id, { label: e.target.value })}/>
                <button className="row-del" onClick={() => delReq(r.id)} title="Remove"><Icon.plus size={14} sw={2} style={{ transform: "rotate(45deg)" }}/></button>
              </div>
            ))}
          </div>

          <div className="dgroup">
            <div className="dgroup-head">
              <span className="dgroup-title">Reference documents</span>
              <button className="btn ghost" onClick={addDoc}><Icon.plus size={13}/>Add</button>
            </div>
            {d.documents.length === 0 && <div className="empty-mini">Link contracts, confirmation letters, portal logins…</div>}
            {d.documents.map(x => (
              <div className="doc-item" key={x.id}>
                <span className="doc-ico"><Icon.credentialing size={16}/></span>
                <div className="doc-main">
                  <input className="doc-name" value={x.name} placeholder="Document name" onChange={e => updDoc(x.id, { name: e.target.value })}/>
                  <input className="doc-note" value={x.note} placeholder="Link or where it lives…" onChange={e => updDoc(x.id, { note: e.target.value })}/>
                </div>
                <button className="row-del" onClick={() => delDoc(x.id)} title="Remove"><Icon.plus size={14} sw={2} style={{ transform: "rotate(45deg)" }}/></button>
              </div>
            ))}
          </div>

          <div className="dgroup">
            <div className="dgroup-head"><span className="dgroup-title">Notes</span></div>
            <textarea className="textarea" value={d.notes} placeholder="Timeline, contacts, gotchas, effective-date estimates…" onChange={e => set("notes", e.target.value)}></textarea>
          </div>
        </div>

        <footer className="drawer-foot">
          {!isNew && <button className="btn danger" onClick={() => onDelete(d.id)}>Delete</button>}
          <div className="spacer"></div>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!canSave} style={!canSave ? { opacity: .5, cursor: "not-allowed" } : undefined}
            onClick={() => canSave && onSave(d)}>{isNew ? "Add payer" : "Save changes"}</button>
        </footer>
      </aside>
    </>
  );
}

window.SECTIONS = Object.assign({}, window.SECTIONS, { credentialing: CredentialingSection });
window.CredentialingSection = CredentialingSection;
