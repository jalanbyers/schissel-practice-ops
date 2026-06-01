/* Shared primitives + icon set for Schissel Health Status.
   Exported to window for use across overview.jsx / sections.jsx / app.jsx. */
const { useState, useEffect, useRef } = React;

/* ---------- Icons (simple stroke) ---------- */
function I({ d, fill, size = 18, sw = 1.7, children, style }) {
  return (
    <svg className="ico" viewBox="0 0 24 24" width={size} height={size} style={style}
      fill={fill || "none"} stroke={fill ? "none" : "currentColor"} strokeWidth={fill ? 0 : sw}
      strokeLinecap="round" strokeLinejoin="round">
      {children || <path d={d} />}
    </svg>
  );
}
const Icon = {
  overview: (p) => <I {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></I>,
  licensing: (p) => <I {...p}><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9.5 12l1.8 1.8L15 10"/></I>,
  credentialing: (p) => <I {...p}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3.5h6V6H9z"/><path d="M8.5 12l1.6 1.6L14 10"/><path d="M8.5 17h7"/></I>,
  engagements: (p) => <I {...p}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M3 12h18"/></I>,
  finances: (p) => <I {...p}><path d="M4 20V10M9 20V4M14 20v-7M19 20V8"/></I>,
  compliance: (p) => <I {...p}><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M12 8v4M12 15.5h.01"/></I>,
  settings: (p) => <I {...p} fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.6 7.6 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.6 7.6 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"/></I>,
  search: (p) => <I {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></I>,
  bell: (p) => <I {...p}><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></I>,
  plus: (p) => <I {...p}><path d="M12 5v14M5 12h14"/></I>,
  arrow: (p) => <I {...p}><path d="M5 12h14M13 6l6 6-6 6"/></I>,
  check: (p) => <I {...p} sw={2.4}><path d="M5 12l4.5 4.5L19 7"/></I>,
  calendar: (p) => <I {...p}><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></I>,
  dollar: (p) => <I {...p}><path d="M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.5s2 2.8 5 3.5 5 1.6 5 3.5-2.2 3-5 3-5-1.1-5-3"/></I>,
  list: (p) => <I {...p}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></I>,
  building: (p) => <I {...p}><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/></I>,
};

/* ---------- Status maps ---------- */
const STATE_STATUS = {
  active:   { cls: "ok",   label: "Active" },
  progress: { cls: "info", label: "In progress" },
  expiring: { cls: "warn", label: "Expiring soon" },
  none:     { cls: "idle", label: "Not licensed" },
};
const PAYER_STATUS = {
  approved:  { cls: "ok",   label: "Approved" },
  review:    { cls: "info", label: "In review" },
  submitted: { cls: "warn", label: "Submitted" },
  notstarted:{ cls: "idle", label: "Not started" },
};
const ENG_STATUS = {
  active:   { cls: "ok",   label: "Active" },
  hold:     { cls: "warn", label: "On hold" },
  prospect: { cls: "info", label: "Prospect" },
  ended:    { cls: "idle", label: "Ended" },
};
const CHK_STATUS = {
  done:       { cls: "ok",   label: "Done" },
  progress:   { cls: "warn", label: "In progress" },
  notstarted: { cls: "idle", label: "Not started" },
};

function StatusPill({ map, status }) {
  const s = (map || {})[status] || { cls: "idle", label: status };
  return <span className={"pill " + s.cls}><span className="dot"></span>{s.label}</span>;
}

/* ---------- Card ---------- */
function Card({ title, desc, cta, onClick, className = "", headRight, children, span }) {
  const clickable = !!onClick;
  return (
    <section
      className={"card " + (clickable ? "clickable " : "") + className}
      style={span ? { gridColumn: `span ${span}` } : undefined}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === "Enter") onClick(); } : undefined}
    >
      {(title || cta || headRight) && (
        <header className="card-head">
          {title && <div>
            <div className="card-title">{title}</div>
            {desc && <div className="card-desc">{desc}</div>}
          </div>}
          {headRight}
          {cta && <span className="card-cta">{cta} <Icon.arrow size={13}/></span>}
        </header>
      )}
      {children}
    </section>
  );
}

/* ---------- Empty state ---------- */
function EmptyState({ icon, title, desc, action }) {
  const Ico = icon || Icon.list;
  return (
    <div className="empty">
      <div className="empty-ico"><Ico size={22}/></div>
      <div className="empty-title">{title}</div>
      <div className="empty-desc">{desc}</div>
      {action && <button className="empty-btn" onClick={(e)=>{e.stopPropagation();}}>{action}</button>}
    </div>
  );
}

/* ---------- Shared drawer ref-doc sections ---------- */
function ReqSection({ title = "Requirements", items, onChange, empty }) {
  const add = () => onChange([...(items || []), { id: window.uid(), label: "", done: false }]);
  const upd = (id, patch) => onChange(items.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const del = (id) => onChange(items.filter((r) => r.id !== id));
  const done = (items || []).filter((r) => r.done).length;
  return (
    <div className="dgroup">
      <div className="dgroup-head">
        <span className="dgroup-title">{title}</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{done}/{(items || []).length} done</span>
        <button className="btn ghost" onClick={add}><Icon.plus size={13}/>Add</button>
      </div>
      {(!items || items.length === 0) && <div className="empty-mini">{empty}</div>}
      {(items || []).map((r) => (
        <div className="req-item" key={r.id}>
          <span className={"req-check" + (r.done ? " done" : "")} onClick={() => upd(r.id, { done: !r.done })}>{r.done && <Icon.check size={13}/>}</span>
          <input className={"req-input" + (r.done ? " done" : "")} value={r.label} placeholder="Describe a requirement…" onChange={(e) => upd(r.id, { label: e.target.value })}/>
          <button className="row-del" onClick={() => del(r.id)} title="Remove"><Icon.plus size={14} sw={2} style={{ transform: "rotate(45deg)" }}/></button>
        </div>
      ))}
    </div>
  );
}
function DocSection({ title = "Reference documents", items, onChange, empty }) {
  const add = () => onChange([...(items || []), { id: window.uid(), name: "", note: "" }]);
  const upd = (id, patch) => onChange(items.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const del = (id) => onChange(items.filter((x) => x.id !== id));
  return (
    <div className="dgroup">
      <div className="dgroup-head">
        <span className="dgroup-title">{title}</span>
        <button className="btn ghost" onClick={add}><Icon.plus size={13}/>Add</button>
      </div>
      {(!items || items.length === 0) && <div className="empty-mini">{empty}</div>}
      {(items || []).map((x) => (
        <div className="doc-item" key={x.id}>
          <span className="doc-ico"><Icon.credentialing size={16}/></span>
          <div className="doc-main">
            <input className="doc-name" value={x.name} placeholder="Document name" onChange={(e) => upd(x.id, { name: e.target.value })}/>
            <input className="doc-note" value={x.note} placeholder="Link or where it lives…" onChange={(e) => upd(x.id, { note: e.target.value })}/>
          </div>
          <button className="row-del" onClick={() => del(x.id)} title="Remove"><Icon.plus size={14} sw={2} style={{ transform: "rotate(45deg)" }}/></button>
        </div>
      ))}
    </div>
  );
}
function SegStatus({ opts, value, onChange }) {
  return (
    <div className="seg-status">
      {opts.map(([k, label, cls]) => (
        <button key={k} className={value === k ? "on " + cls : ""} onClick={() => onChange(k)}>
          <span className="dot" style={{ background: `var(--${cls})` }}></span>{label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Currency helpers ---------- */
const fmtK = (n) => "$" + (n/1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k";
const fmtUSD = (n) => "$" + n.toLocaleString("en-US");

Object.assign(window, {
  Icon, StatusPill, Card, EmptyState, ReqSection, DocSection, SegStatus,
  STATE_STATUS, PAYER_STATUS, ENG_STATUS, CHK_STATUS,
  fmtK, fmtUSD,
});
