/* Settings — editable practice profile (synced to the sidebar), notification
   preferences, and data management (export / reset). Shares the settings store
   in store.jsx. Replaces the stub window.SECTIONS.settings. */
const { useState: useStateS, useEffect: useEffectS } = React;

function Toggle({ on, onChange }) {
  return <button className={"switch" + (on ? " on" : "")} role="switch" aria-checked={on} onClick={() => onChange(!on)}></button>;
}

function SettingsSection() {
  const [settings, setSettings] = useSettings();
  const [draft, setDraft] = useStateS(() => ({ name: settings.name, entity: settings.entity, homeState: settings.homeState, npi: settings.npi, ein: settings.ein, email: settings.email, phone: settings.phone, timezone: settings.timezone }));
  const [saved, setSaved] = useStateS(false);
  const set = (k, v) => { setDraft(p => ({ ...p, [k]: v })); setSaved(false); };

  // re-sync the form when the store changes externally (e.g. Reset to sample data)
  useEffectS(() => {
    setDraft({ name: settings.name, entity: settings.entity, homeState: settings.homeState, npi: settings.npi, ein: settings.ein, email: settings.email, phone: settings.phone, timezone: settings.timezone });
  }, [settings]);

  const dirty = Object.keys(draft).some(k => draft[k] !== settings[k]);
  const saveProfile = () => { setSettings(prev => ({ ...prev, ...draft })); setSaved(true); setTimeout(() => setSaved(false), 2200); };
  const setNotif = (k, v) => setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, [k]: v } }));

  const exportData = () => {
    const dump = {};
    ALL_STORE_KEYS.forEach(k => { try { dump[k] = JSON.parse(localStorage.getItem(k)); } catch (e) {} });
    dump._exportedAt = new Date().toISOString();
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "schissel-practice-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const [confirmReset, setConfirmReset] = useStateS(false);
  const resetAll = () => { ALL_STORES().forEach(s => s.reset()); setConfirmReset(false); };

  const N = settings.notifications;
  const fld = (label, key, ph, opts) => (
    <div className="field full"><label>{label}</label>
      <input className={"input" + (opts && opts.mono ? " mono" : "")} value={draft[key]} onChange={e => set(key, e.target.value)} placeholder={ph}/></div>
  );

  return (
    <div>
      <SectionHead title="Settings" desc="Practice profile, reminders, and your data — everything here stays on this device."/>

      <div className="grid">
        <div className="col-7"><Card title="Practice profile" desc="Used across the dashboard, including the sidebar"
          headRight={saved ? <span className="saved-tag"><Icon.check size={13}/>Saved</span> : null}>
          <div className="field-grid">
            {fld("Practice name", "name", "e.g. Schissel Health Status")}
            {fld("Legal entity", "entity", "e.g. Schissel Medicine, PLLC")}
            <div className="field"><label>Home state</label>
              <select className="input" value={draft.homeState} onChange={e => set("homeState", e.target.value)}>
                {window.US_GRID.map(g => g[0]).sort().map(c => <option key={c} value={c}>{c} — {window.US_NAMES[c] || c}</option>)}
              </select></div>
            <div className="field"><label>Timezone</label><input className="input" value={draft.timezone} onChange={e => set("timezone", e.target.value)}/></div>
            <div className="field"><label>NPI (Type 2)</label><input className="input mono" value={draft.npi} onChange={e => set("npi", e.target.value)}/></div>
            <div className="field"><label>EIN</label><input className="input mono" value={draft.ein} onChange={e => set("ein", e.target.value)}/></div>
            <div className="field"><label>Email</label><input className="input" value={draft.email} onChange={e => set("email", e.target.value)}/></div>
            <div className="field"><label>Phone</label><input className="input" value={draft.phone} onChange={e => set("phone", e.target.value)}/></div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button className="btn primary" disabled={!dirty} style={!dirty ? { opacity: .5, cursor: "not-allowed" } : undefined} onClick={() => dirty && saveProfile()}>Save changes</button>
            {dirty && <button className="btn" onClick={() => setDraft({ name: settings.name, entity: settings.entity, homeState: settings.homeState, npi: settings.npi, ein: settings.ein, email: settings.email, phone: settings.phone, timezone: settings.timezone })}>Discard</button>}
          </div>
        </Card></div>

        <div className="col-5"><Card title="Reminders" desc="When to flag upcoming deadlines">
          {[["licenseRenewals", "License renewals", "Flag state licenses before they expire"],
            ["recredentialing", "Re-credentialing", "Flag payer revalidation dates"],
            ["complianceDue", "Compliance tasks", "Flag tasks as their due date nears"],
            ["weeklyDigest", "Weekly digest", "A Monday summary of what's due"]].map(([k, label, help]) => (
            <div className="set-row" key={k}>
              <div className="set-main"><div className="set-label">{label}</div><div className="set-help">{help}</div></div>
              <Toggle on={!!N[k]} onChange={v => setNotif(k, v)}/>
            </div>
          ))}
          <div className="set-row">
            <div className="set-main"><div className="set-label">Lead time</div><div className="set-help">How far ahead to start reminding</div></div>
            <div className="lead-seg">
              {[14, 30, 60, 90].map(d => <button key={d} className={N.leadDays === d ? "on" : ""} onClick={() => setNotif("leadDays", d)}>{d}d</button>)}
            </div>
          </div>
        </Card></div>

        <div className="col-12"><Card title="Data & privacy" desc="This is a business-operations workspace — no patient information (PHI) is stored.">
          <div className="set-row">
            <div className="set-main"><div className="set-label">Local storage</div><div className="set-help">All data lives in this browser only. Nothing is sent to a server.</div></div>
          </div>
          <div className="set-row">
            <div className="set-main"><div className="set-label">Export data</div><div className="set-help">Download a JSON backup of licenses, payers, engagements, tasks, and finances.</div></div>
            <button className="btn" onClick={exportData}><Icon.arrow size={14} style={{ transform: "rotate(90deg)" }}/>Export JSON</button>
          </div>
          <div style={{ marginTop: 14 }} className="danger-zone">
            <div className="set-main"><div className="set-label" style={{ color: "var(--bad)" }}>Reset to sample data</div><div className="set-help">Clears all your edits and restores the original demo content. Can't be undone.</div></div>
            {confirmReset
              ? <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn" onClick={() => setConfirmReset(false)}>Cancel</button>
                  <button className="btn danger" onClick={resetAll}>Confirm reset</button>
                </div>
              : <button className="btn danger" onClick={() => setConfirmReset(true)}>Reset…</button>}
          </div>
        </Card></div>
      </div>
    </div>
  );
}

window.SECTIONS = Object.assign({}, window.SECTIONS, { settings: SettingsSection });
window.SettingsSection = SettingsSection;
