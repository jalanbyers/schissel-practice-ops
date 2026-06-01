/* Licensing workspace — add / modify state licenses, each with an editable
   reference doc (key facts, renewal-requirements checklist, reference
   documents, notes). Persists to localStorage so updates stick.
   Replaces the stub window.SECTIONS.licensing. */
const { useState, useEffect, useRef } = React;
/* Shared helpers (uid, CYCLES, STATUS_OPTS, daysUntil, fmtDays, fmtDate) and the
   persisted license store live in store.jsx and are read off window. */

/* ---------------- Section ---------------- */
function LicensingSection() {
  const [list, setList] = useLicenses();
  const [openCode, setOpenCode] = useState(null);   // code being edited, or "__new__"
  const [prefill, setPrefill] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(null);

  const counts = list.reduce((a, s) => (a[s.status] = (a[s.status] || 0) + 1, a), {});
  const imlcCount = list.filter(s => s.imlc).length;

  const openState = (code) => {
    if (list.some(s => s.code === code)) { setPrefill(null); setOpenCode(code); }
    else { setPrefill({ code, status: "progress" }); setOpenCode("__new__"); }
  };
  const openAdd = () => { setPrefill(null); setOpenCode("__new__"); };
  const close = () => { setOpenCode(null); setPrefill(null); };

  const saveLicense = (obj) => {
    setList(prev => {
      const i = prev.findIndex(s => s.code === obj.code);
      if (i === -1) return [...prev, obj];
      const next = prev.slice(); next[i] = obj; return next;
    });
    setOpenCode(obj.code); setPrefill(null);
  };
  const removeLicense = (code) => { setList(prev => prev.filter(s => s.code !== code)); close(); };

  const editing = openCode && openCode !== "__new__" ? list.find(s => s.code === openCode) : null;
  const isNew = openCode === "__new__";

  // renewals: active/expiring with a real date, soonest first
  const renewals = list
    .filter(s => s.expires && s.expires.includes("-"))
    .map(s => ({ ...s, d: daysUntil(s.expires) }))
    .sort((a, b) => a.d - b.d);

  const q = query.trim().toLowerCase();
  const filteredRenewals = renewals.filter(s =>
    (!filter || s.status === filter) &&
    (!q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)));

  return (
    <div>
      <SectionHead title="Licensing"
        desc="State medical licenses, renewal dates, and a living reference doc of renewal requirements per state."
        actions={
          <div className="lic-toolbar">
            <div className="lic-search"><Icon.search size={15}/>
              <input placeholder="Find a state…" value={query} onChange={e => setQuery(e.target.value)}/>
            </div>
            <button className="btn primary" onClick={openAdd}><Icon.plus size={15}/>Add state</button>
          </div>
        }/>

      <div className="grid" style={{ marginBottom: "var(--gap-grid)" }}>
        {STATUS_OPTS.map(([k, label, cls]) => (
          <div className="col-3" key={k}>
            <Card className={"kpi stat-card" + (filter === k ? " sel" : "")}
              onClick={() => setFilter(filter === k ? null : k)}>
              <div className="stat-mini"><span className={"pill " + cls} style={{ padding: "2px 7px" }}><span className="dot"></span>{label}</span></div>
              <div className="kpi-value" style={{ margin: "10px 0 2px" }}>{counts[k] || 0}</div>
              <div className="kpi-sub">{filter === k ? "Filtering · tap to clear" : "tap to filter"}</div>
            </Card>
          </div>
        ))}
      </div>

      <div className="grid">
        <div className="col-7">
          <Card title="Footprint" desc="Click any state to open its reference doc · grey = not licensed"
            headRight={<span className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{imlcCount} IMLC-eligible</span>}>
            <LicenseTiles states={list} onSelect={openState}/>
            <div className="legend">
              {[["ok","Active"],["info","In progress"],["warn","Expiring ≤90d"],["idle","Not licensed"]].map(([c,l]) => (
                <span className="legend-item" key={c}><span className="legend-sw" style={{background:`var(--${c==='idle'?'border-strong':c})`}}></span>{l}</span>
              ))}
              <span className="legend-item" style={{marginLeft:"auto"}}><span style={{width:8,height:8,borderRadius:"50%",background:"var(--primary)"}}></span>IMLC-eligible</span>
            </div>
          </Card>
        </div>
        <div className="col-5">
          <Card title="Upcoming renewals" desc={filter ? `Filtered: ${STATUS_OPTS.find(o=>o[0]===filter)[1]}` : "Soonest first"}>
            {filteredRenewals.length === 0 ? (
              <EmptyState icon={Icon.calendar} title="No matching renewals"
                desc="Active licenses with a renewal date will appear here, ordered by what's due next."/>
            ) : filteredRenewals.map(s => {
              const cls = s.d < 30 ? "bad" : s.d < 90 ? "warn" : "";
              return (
                <div className="renew-row" key={s.code} onClick={() => openState(s.code)}>
                  <span className="renew-code">{s.code}</span>
                  <div>
                    <div className="renew-name">{s.name}</div>
                    <div className="renew-sub mono">renews {fmtDate(s.expires)}</div>
                  </div>
                  <span className={"days-badge " + cls}>{fmtDays(s.d)}</span>
                </div>
              );
            })}
          </Card>
        </div>
      </div>

      {(editing || isNew) && (
        <LicenseDrawer
          key={openCode}
          license={editing}
          isNew={isNew}
          prefill={prefill}
          existingCodes={list.map(s => s.code)}
          onSave={saveLicense}
          onDelete={removeLicense}
          onClose={close}/>
      )}
    </div>
  );
}

/* ---------------- Drawer ---------------- */
function blankLicense(prefill) {
  const code = prefill?.code || "";
  return {
    code, name: code ? (window.US_NAMES[code] || code) : "",
    status: prefill?.status || "progress", imlc: false, home: false,
    licenseNo: "", issued: "", expires: "", cycle: "Biennial", fee: "",
    board: "", boardUrl: "", requirements: [], documents: [], notes: "",
  };
}

function LicenseDrawer({ license, isNew, prefill, existingCodes, onSave, onDelete, onClose }) {
  const [d, setD] = useState(() => license ? JSON.parse(JSON.stringify(license)) : blankLicense(prefill));
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));

  const onCode = (code) => setD(p => ({ ...p, code, name: window.US_NAMES[code] || code }));
  const availableCodes = window.US_GRID.map(g => g[0])
    .filter(c => c === d.code || !existingCodes.includes(c))
    .sort((a, b) => (window.US_NAMES[a] || a).localeCompare(window.US_NAMES[b] || b));

  // requirements
  const addReq = () => set("requirements", [...d.requirements, { id: uid(), label: "", done: false }]);
  const updReq = (id, patch) => set("requirements", d.requirements.map(r => r.id === id ? { ...r, ...patch } : r));
  const delReq = (id) => set("requirements", d.requirements.filter(r => r.id !== id));
  const reqDone = d.requirements.filter(r => r.done).length;

  // documents
  const addDoc = () => set("documents", [...d.documents, { id: uid(), name: "", note: "" }]);
  const updDoc = (id, patch) => set("documents", d.documents.map(x => x.id === id ? { ...x, ...patch } : x));
  const delDoc = (id) => set("documents", d.documents.filter(x => x.id !== id));

  const canSave = !!d.code;
  const meta = STATE_STATUS[d.status] || STATE_STATUS.none;
  const dUntil = daysUntil(d.expires);

  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <aside className="drawer" role="dialog" aria-label="License details">
        <header className="drawer-head">
          <div style={{ flex: 1 }}>
            <div className="drawer-eyebrow">{isNew ? "Add state license" : "State license"}</div>
            <div className="drawer-title">
              <span className="mono">{d.code || "—"}</span>
              <span style={{ fontWeight: 500, fontSize: 16, color: "var(--ink-2)" }}>{d.name || "Select a state"}</span>
            </div>
            <div className="drawer-badges">
              <StatusPill map={STATE_STATUS} status={d.status}/>
              {d.home && <span className="mini-badge">★ Home state</span>}
              {d.imlc && <span className="mini-badge">IMLC-eligible</span>}
              {dUntil != null && d.status !== "none" && <span className="mini-badge">{fmtDays(dUntil)}</span>}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close" style={{ flex: "none" }}><Icon.plus size={18} sw={2} style={{ transform: "rotate(45deg)" }}/></button>
        </header>

        <div className="drawer-body">
          {/* status */}
          <div className="dgroup">
            <div className="dgroup-head"><span className="dgroup-title">Status</span></div>
            <div className="seg-status">
              {STATUS_OPTS.map(([k, label, cls]) => (
                <button key={k} className={(d.status === k ? "on " + cls : "")} onClick={() => set("status", k)}>
                  <span className="dot" style={{ background: `var(--${cls === "idle" ? "idle" : cls})` }}></span>{label}
                </button>
              ))}
            </div>
          </div>

          {/* key facts */}
          <div className="dgroup">
            <div className="dgroup-head"><span className="dgroup-title">Key facts</span></div>
            <div className="field-grid">
              {isNew && (
                <div className="field full">
                  <label>State</label>
                  <select className="input" value={d.code} onChange={e => onCode(e.target.value)}>
                    <option value="">Select a state…</option>
                    {availableCodes.map(c => <option key={c} value={c}>{c} — {window.US_NAMES[c] || c}</option>)}
                  </select>
                </div>
              )}
              <div className="field"><label>License number</label>
                <input className="input mono" value={d.licenseNo} onChange={e => set("licenseNo", e.target.value)} placeholder="e.g. MD-000000"/></div>
              <div className="field"><label>Renewal fee</label>
                <input className="input" value={d.fee} onChange={e => set("fee", e.target.value)} placeholder="e.g. $300"/></div>
              <div className="field"><label>Issued</label>
                <input className="input" type="date" value={d.issued} onChange={e => set("issued", e.target.value)}/></div>
              <div className="field"><label>Expires / renews</label>
                <input className="input" type="date" value={d.expires} onChange={e => set("expires", e.target.value)}/></div>
              <div className="field"><label>Renewal cycle</label>
                <select className="input" value={d.cycle} onChange={e => set("cycle", e.target.value)}>
                  {CYCLES.map(c => <option key={c}>{c}</option>)}
                </select></div>
              <div className="field"><label>IMLC eligible</label>
                <select className="input" value={d.imlc ? "yes" : "no"} onChange={e => set("imlc", e.target.value === "yes")}>
                  <option value="no">No</option><option value="yes">Yes</option>
                </select></div>
              <div className="field full"><label>Licensing board</label>
                <input className="input" value={d.board} onChange={e => set("board", e.target.value)} placeholder="e.g. State Board of Medicine"/></div>
              <div className="field full"><label>Board website</label>
                <input className="input" value={d.boardUrl} onChange={e => set("boardUrl", e.target.value)} placeholder="e.g. board.state.gov"/></div>
            </div>
          </div>

          {/* requirements */}
          <div className="dgroup">
            <div className="dgroup-head">
              <span className="dgroup-title">Renewal requirements</span>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{reqDone}/{d.requirements.length} done</span>
              <button className="btn ghost" onClick={addReq}><Icon.plus size={13}/>Add</button>
            </div>
            {d.requirements.length === 0 && <div className="empty-mini">No requirements logged yet. Add CME hours, fees, portal steps, exams…</div>}
            {d.requirements.map(r => (
              <div className="req-item" key={r.id}>
                <span className={"req-check" + (r.done ? " done" : "")} onClick={() => updReq(r.id, { done: !r.done })}>
                  {r.done && <Icon.check size={13}/>}
                </span>
                <input className={"req-input" + (r.done ? " done" : "")} value={r.label}
                  placeholder="Describe a renewal requirement…" onChange={e => updReq(r.id, { label: e.target.value })}/>
                <button className="row-del" onClick={() => delReq(r.id)} title="Remove"><Icon.plus size={14} sw={2} style={{ transform: "rotate(45deg)" }}/></button>
              </div>
            ))}
          </div>

          {/* documents */}
          <div className="dgroup">
            <div className="dgroup-head">
              <span className="dgroup-title">Reference documents</span>
              <button className="btn ghost" onClick={addDoc}><Icon.plus size={13}/>Add</button>
            </div>
            {d.documents.length === 0 && <div className="empty-mini">Link files, portals, or note where each document lives.</div>}
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

          {/* notes */}
          <div className="dgroup">
            <div className="dgroup-head"><span className="dgroup-title">Notes</span></div>
            <textarea className="textarea" value={d.notes} placeholder="Renewal window, processing times, gotchas, contacts…"
              onChange={e => set("notes", e.target.value)}></textarea>
          </div>
        </div>

        <footer className="drawer-foot">
          {!isNew && <button className="btn danger" onClick={() => onDelete(d.code)}>Delete</button>}
          <div className="spacer"></div>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!canSave} style={!canSave ? { opacity: .5, cursor: "not-allowed" } : undefined}
            onClick={() => canSave && onSave(d)}>{isNew ? "Add license" : "Save changes"}</button>
        </footer>
      </aside>
    </>
  );
}

window.SECTIONS = Object.assign({}, window.SECTIONS, { licensing: LicensingSection });
window.LicensingSection = LicensingSection;
