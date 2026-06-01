/* Compliance workspace — add / modify setup & compliance tasks, each with an
   editable reference doc (sub-step checklist, documents, notes). Shares the
   persisted checklist store in store.jsx. */
const { useState: useStateK } = React;

/* ---------------- Section ---------------- */
function ComplianceSection() {
  const [list, setList] = useChecklist();
  const [openId, setOpenId] = useStateK(null);
  const [query, setQuery] = useStateK("");
  const [filter, setFilter] = useStateK(null);

  const counts = list.reduce((a, c) => (a[c.status] = (a[c.status] || 0) + 1, a), {});
  const done = counts.done || 0;
  const pct = list.length ? Math.round((done / list.length) * 100) : 0;

  const save = (obj) => {
    setList(prev => { const i = prev.findIndex(c => c.id === obj.id); if (i === -1) return [...prev, obj]; const n = prev.slice(); n[i] = obj; return n; });
    setOpenId(obj.id);
  };
  const remove = (id) => { setList(prev => prev.filter(c => c.id !== id)); setOpenId(null); };
  const quickToggle = (id, e) => {
    e.stopPropagation();
    setList(prev => prev.map(c => c.id === id ? { ...c, status: c.status === "done" ? "notstarted" : "done" } : c));
  };

  const editing = openId && openId !== "__new__" ? list.find(c => c.id === openId) : null;
  const isNew = openId === "__new__";
  const q = query.trim().toLowerCase();
  const order = { progress: 0, notstarted: 1, done: 2 };
  const filtered = list
    .filter(c => (!filter || c.status === filter) && (!q || c.task.toLowerCase().includes(q) || (c.group || "").toLowerCase().includes(q)))
    .sort((a, b) => (order[a.status] - order[b.status]) || (daysUntil(a.date) ?? 1e9) - (daysUntil(b.date) ?? 1e9));

  return (
    <div>
      <SectionHead title="Compliance & setup"
        desc="Entity, banking, HIPAA, and insurance readiness — each task with its own checklist of sub-steps and documents."
        actions={
          <div className="lic-toolbar">
            <div className="lic-search"><Icon.search size={15}/><input placeholder="Find a task…" value={query} onChange={e => setQuery(e.target.value)}/></div>
            <button className="btn primary" onClick={() => setOpenId("__new__")}><Icon.plus size={15}/>Add task</button>
          </div>
        }/>

      <div className="grid" style={{ marginBottom: "var(--gap-grid)" }}>
        <div className="col-3">
          <Card className="kpi"><span className="kpi-label">Readiness</span>
            <div className="kpi-value" style={{ margin: "10px 0 8px" }}>{pct}%</div>
            <div className="progress"><span style={{ width: `${pct}%` }}></span></div>
            <div className="kpi-sub" style={{ marginTop: 7 }}>{done} of {list.length} complete</div>
          </Card>
        </div>
        {CHK_STATUS_OPTS.map(([k, label, cls]) => (
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
        <div className="col-12"><Card title="Tasks" desc={filter ? `Filtered: ${CHK_STATUS_OPTS.find(o => o[0] === filter)[1]}` : "Tick the box to complete · click a row to open its checklist"}>
          {filtered.length === 0 ? (
            <EmptyState icon={Icon.compliance} title="No matching tasks" desc="Add setup and compliance tasks — entity, banking, HIPAA, insurance." action="Add task"/>
          ) : (
            <div className="check-list">
              {filtered.map(c => {
                const dn = daysUntil(c.date);
                const soon = dn != null && dn <= 14 && c.status !== "done";
                const sub = c.requirements.filter(r => r.done).length;
                return (
                  <div className="check-item" key={c.id} style={{ cursor: "pointer" }} onClick={() => setOpenId(c.id)}>
                    <span className={"check-box " + c.status} onClick={(e) => quickToggle(c.id, e)} title="Toggle complete">
                      {c.status === "done" && <Icon.check size={13}/>}{c.status === "progress" && <span style={{ fontSize: 11, fontWeight: 700 }}>·</span>}
                    </span>
                    <div>
                      <span className={"check-task " + (c.status === "done" ? "done" : "")}>{c.task}</span>
                      {c.requirements.length > 0 && <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{sub}/{c.requirements.length} sub-steps</div>}
                    </div>
                    <span className="check-meta">
                      <span className="tag">{c.group}</span>
                      {c.status !== "done" && c.date && <span className={"check-due" + (soon ? " soon" : "")}>due {fmtDate(c.date)}</span>}
                      <StatusPill map={CHK_STATUS} status={c.status}/>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card></div>
      </div>

      {(editing || isNew) && <TaskDrawer key={openId} task={editing} isNew={isNew} onSave={save} onDelete={remove} onClose={() => setOpenId(null)}/>}
    </div>
  );
}

/* ---------------- Drawer ---------------- */
function blankTask() {
  return { id: uid(), task: "", group: "General", status: "notstarted", date: "", owner: "", requirements: [], documents: [], notes: "" };
}
function TaskDrawer({ task, isNew, onSave, onDelete, onClose }) {
  const [d, setD] = useStateK(() => task ? JSON.parse(JSON.stringify(task)) : blankTask());
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const canSave = !!d.task.trim();
  const dn = daysUntil(d.date);

  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <aside className="drawer" role="dialog" aria-label="Task details">
        <header className="drawer-head">
          <div style={{ flex: 1 }}>
            <div className="drawer-eyebrow">{isNew ? "Add compliance task" : "Compliance task"}</div>
            <div className="drawer-title"><span style={{ fontSize: 18 }}>{d.task || "New task"}</span></div>
            <div className="drawer-badges">
              <StatusPill map={CHK_STATUS} status={d.status}/>
              <span className="mini-badge">{d.group}</span>
              {dn != null && d.status !== "done" && <span className="mini-badge">{fmtDays(dn)}</span>}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close" style={{ flex: "none" }}><Icon.plus size={18} sw={2} style={{ transform: "rotate(45deg)" }}/></button>
        </header>

        <div className="drawer-body">
          <div className="dgroup"><div className="dgroup-head"><span className="dgroup-title">Status</span></div>
            <SegStatus opts={CHK_STATUS_OPTS} value={d.status} onChange={v => set("status", v)}/></div>

          <div className="dgroup"><div className="dgroup-head"><span className="dgroup-title">Key facts</span></div>
            <div className="field-grid">
              <div className="field full"><label>Task</label><input className="input" value={d.task} onChange={e => set("task", e.target.value)} placeholder="e.g. HIPAA security risk assessment"/></div>
              <div className="field"><label>Category</label>
                <select className="input" value={d.group} onChange={e => set("group", e.target.value)}>{CHK_GROUPS.map(g => <option key={g}>{g}</option>)}</select></div>
              <div className="field"><label>Due date</label><input className="input" type="date" value={d.date || ""} onChange={e => set("date", e.target.value)}/></div>
              <div className="field full"><label>Owner</label><input className="input" value={d.owner} onChange={e => set("owner", e.target.value)} placeholder="who's responsible"/></div>
            </div>
          </div>

          <ReqSection title="Sub-steps" items={d.requirements} onChange={v => set("requirements", v)}
            empty="Break the task into checkable sub-steps…"/>
          <DocSection items={d.documents} onChange={v => set("documents", v)} empty="Link policies, signed forms, confirmations…"/>

          <div className="dgroup"><div className="dgroup-head"><span className="dgroup-title">Notes</span></div>
            <textarea className="textarea" value={d.notes} placeholder="Context, deadlines, who to contact, renewal cadence…" onChange={e => set("notes", e.target.value)}></textarea></div>
        </div>

        <footer className="drawer-foot">
          {!isNew && <button className="btn danger" onClick={() => onDelete(d.id)}>Delete</button>}
          <div className="spacer"></div>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!canSave} style={!canSave ? { opacity: .5, cursor: "not-allowed" } : undefined} onClick={() => canSave && onSave(d)}>{isNew ? "Add task" : "Save changes"}</button>
        </footer>
      </aside>
    </>
  );
}

window.SECTIONS = Object.assign({}, window.SECTIONS, { compliance: ComplianceSection });
window.ComplianceSection = ComplianceSection;
