'use client';

import { useState, useEffect } from 'react';
import { Check, Download } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { AuditFeed } from '@/components/audit/AuditFeed';
import { LoadingState } from '@/components/ui/LoadingState';
import { US_GRID, US_NAMES } from '@/lib/us-grid';
import { MOCK_SETTINGS } from '@/lib/mock-data';
import { emitAudit } from '@/lib/audit';
import { usePracticeProfile } from '@/components/providers/SettingsContext';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ProfileDraft {
  name: string; entity: string; homeState: string;
  timezone: string; npi: string; ein: string;
  email: string; phone: string;
}

interface NotifPrefs {
  licenseRenewals: boolean;
  recredentialing: boolean;
  complianceDue: boolean;
  weeklyDigest: boolean;
  leadDays: 14 | 30 | 60 | 90;
}

const LEAD_DAYS = [14, 30, 60, 90] as const;

const DEFAULT_PROFILE: ProfileDraft = {
  name: MOCK_SETTINGS.name,
  entity: MOCK_SETTINGS.entity,
  homeState: MOCK_SETTINGS.homeState,
  timezone: 'America/New_York',
  npi: '', ein: '', email: '', phone: '',
};

const DEFAULT_NOTIFS: NotifPrefs = {
  licenseRenewals: true,
  recredentialing: true,
  complianceDue: true,
  weeklyDigest: false,
  leadDays: 30,
};

// ---------------------------------------------------------------------------
// Toggle switch
// ---------------------------------------------------------------------------
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className={`switch${on ? ' on' : ''}`}
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
    />
  );
}

// ---------------------------------------------------------------------------
// All US state codes for the home state select
// ---------------------------------------------------------------------------
const STATE_CODES = [...US_GRID.map(([code]) => code)].sort();

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------
export function SettingsSection() {
  const { updateProfile } = usePracticeProfile();
  const { data: apiSettings, isLoading, isError } = useSettings();
  const { mutate: patchSettings } = useUpdateSettings();

  const [profile, setProfile] = useState<ProfileDraft>(DEFAULT_PROFILE);
  const [draft, setDraft]     = useState<ProfileDraft>(DEFAULT_PROFILE);
  const [saved, setSaved]     = useState(false);
  const [notifs, setNotifs]   = useState<NotifPrefs>(DEFAULT_NOTIFS);
  const [confirmReset, setConfirmReset] = useState(false);

  // Hydrate local state from API response once loaded.
  useEffect(() => {
    if (!apiSettings) return;
    const loaded: ProfileDraft = {
      name:      apiSettings.name      || DEFAULT_PROFILE.name,
      entity:    apiSettings.entity    || DEFAULT_PROFILE.entity,
      homeState: apiSettings.homeState || DEFAULT_PROFILE.homeState,
      timezone:  apiSettings.timezone  || DEFAULT_PROFILE.timezone,
      npi:       apiSettings.npi       ?? '',
      ein:       apiSettings.ein       ?? '',
      email:     apiSettings.email     ?? '',
      phone:     apiSettings.phone     ?? '',
    };
    setProfile(loaded);
    setDraft(loaded);
    if (apiSettings.notifications) {
      setNotifs(apiSettings.notifications as NotifPrefs);
    }
  }, [apiSettings]);

  const setField = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const isDirty = (Object.keys(draft) as (keyof ProfileDraft)[]).some(
    k => draft[k] !== profile[k],
  );

  const saveProfile = () => {
    setProfile(draft);
    // 1. Update sidebar brand block immediately via context.
    updateProfile({ name: draft.name, entity: draft.entity });
    // 2. Persist to /v1/settings (PATCH upsert, tenant-scoped).
    patchSettings({
      name:      draft.name,
      entity:    draft.entity,
      homeState: draft.homeState,
      timezone:  draft.timezone,
      npi:       draft.npi   || null,
      ein:       draft.ein   || null,
      email:     draft.email || null,
      phone:     draft.phone || null,
    });
    // 3. Emit audit event (in-memory + POST /v1/audit).
    emitAudit({
      action:   'update',
      entity:   'task',          // 'settings' not in entity enum; 'task' is closest
      entityId: 'settings',
      label:    `Practice profile updated (${draft.name})`,
      tenantId: 'demo',
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const discardProfile = () => {
    setDraft(profile);
    setSaved(false);
  };

  if (isLoading) return <LoadingState />;
  if (isError)   return <LoadingState error message="Could not load settings. Check your connection." />;

  const setNotif = <K extends keyof NotifPrefs>(key: K, value: NotifPrefs[K]) => {
    setNotifs(prev => ({ ...prev, [key]: value }));
  };

  // Export: download a JSON snapshot of all mock data
  const exportData = () => {
    const payload = {
      _exportedAt: new Date().toISOString(),
      profile,
      notifications: notifs,
      _note: 'v1 — live data will be included once API is wired in step 10',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'schissel-practice-data.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const resetAll = () => {
    setProfile(DEFAULT_PROFILE);
    setDraft(DEFAULT_PROFILE);
    setNotifs(DEFAULT_NOTIFS);
    setConfirmReset(false);
    // In production: call API to reset all tenant data
  };

  return (
    <div>
      <SectionHeader
        title="Settings"
        desc="Practice profile, reminders, and your data — all changes are local until step 10 API wiring."
      />

      <div className="dash-grid">

        {/* ── Practice profile ── */}
        <div className="col-7">
          <Card
            title="Practice profile"
            desc="Used across the dashboard, including the sidebar"
            headRight={
              saved
                ? <span className="saved-tag"><Check size={13} /> Saved</span>
                : undefined
            }
          >
            <div className="field-grid">
              <div className="field full">
                <label htmlFor="s-name">Practice name</label>
                <input id="s-name" className="input" value={draft.name}
                  placeholder="e.g. Schissel Health Status"
                  onChange={e => setField('name', e.target.value)} />
              </div>
              <div className="field full">
                <label htmlFor="s-entity">Legal entity</label>
                <input id="s-entity" className="input" value={draft.entity}
                  placeholder="e.g. Schissel Medicine, PLLC"
                  onChange={e => setField('entity', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="s-home-state">Home state</label>
                <select id="s-home-state" className="input" value={draft.homeState}
                  onChange={e => setField('homeState', e.target.value)}>
                  {STATE_CODES.map(c => (
                    <option key={c} value={c}>{c} — {US_NAMES[c] ?? c}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="s-tz">Timezone</label>
                <input id="s-tz" className="input" value={draft.timezone}
                  onChange={e => setField('timezone', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="s-npi">NPI (Type 2)</label>
                <input id="s-npi" className="input mono" value={draft.npi}
                  placeholder="10-digit NPI"
                  onChange={e => setField('npi', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="s-ein">EIN</label>
                <input id="s-ein" className="input mono" value={draft.ein}
                  placeholder="XX-XXXXXXX"
                  onChange={e => setField('ein', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="s-email">Email</label>
                <input id="s-email" className="input" type="email" value={draft.email}
                  placeholder="practice@email.com"
                  onChange={e => setField('email', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="s-phone">Phone</label>
                <input id="s-phone" className="input" type="tel" value={draft.phone}
                  placeholder="(603) 000-0000"
                  onChange={e => setField('phone', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                className="btn primary"
                disabled={!isDirty}
                style={!isDirty ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                onClick={() => isDirty && saveProfile()}
              >
                Save changes
              </button>
              {isDirty && (
                <button type="button" className="btn" onClick={discardProfile}>
                  Discard
                </button>
              )}
            </div>
          </Card>
        </div>

        {/* ── Reminders ── */}
        <div className="col-5">
          <Card title="Reminders" desc="When to flag upcoming deadlines">
            {([
              ['licenseRenewals', 'License renewals',   'Flag state licenses before they expire'],
              ['recredentialing', 'Re-credentialing',   'Flag payer revalidation dates'],
              ['complianceDue',   'Compliance tasks',   'Flag tasks as their due date nears'],
              ['weeklyDigest',    'Weekly digest',      'A Monday summary of what's due'],
            ] as [keyof NotifPrefs, string, string][]).map(([key, label, help]) => (
              <div key={key} className="set-row">
                <div className="set-main">
                  <div className="set-label">{label}</div>
                  <div className="set-help">{help}</div>
                </div>
                <Toggle
                  on={!!notifs[key]}
                  onChange={v => setNotif(key, v as NotifPrefs[typeof key])}
                />
              </div>
            ))}
            <div className="set-row">
              <div className="set-main">
                <div className="set-label">Lead time</div>
                <div className="set-help">How far ahead to start reminding</div>
              </div>
              <div className="lead-seg">
                {LEAD_DAYS.map(d => (
                  <button
                    key={d}
                    type="button"
                    className={notifs.leadDays === d ? 'on' : ''}
                    onClick={() => setNotif('leadDays', d)}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* ── Data & privacy ── */}
        <div className="col-12">
          <Card
            title="Data & privacy"
            desc="This is a business-operations workspace — no patient information (PHI) is stored here."
          >
            <div className="set-row">
              <div className="set-main">
                <div className="set-label">PHI boundary</div>
                <div className="set-help">
                  The frontend never persists PHI in localStorage, sessionStorage, or IndexedDB.
                  All sensitive data paths route through the API (wired in step 10).
                </div>
              </div>
            </div>
            <div className="set-row">
              <div className="set-main">
                <div className="set-label">Export data</div>
                <div className="set-help">
                  Download a JSON snapshot of settings and notification preferences.
                  Full data export is available after step 10 API wiring.
                </div>
              </div>
              <button type="button" className="btn" onClick={exportData}>
                <Download size={14} /> Export JSON
              </button>
            </div>
            <div style={{ marginTop: 14 }} className="danger-zone">
              <div className="set-main">
                <div className="set-label" style={{ color: 'var(--bad)' }}>Reset to defaults</div>
                <div className="set-help">
                  Clears profile edits and notification preferences. Cannot be undone.
                </div>
              </div>
              {confirmReset ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn" onClick={() => setConfirmReset(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn danger" onClick={resetAll}>
                    Confirm reset
                  </button>
                </div>
              ) : (
                <button type="button" className="btn danger" onClick={() => setConfirmReset(true)}>
                  Reset…
                </button>
              )}
            </div>
          </Card>
        </div>

        {/* ── Activity log (audit feed) ── */}
        <div className="col-12">
          <Card
            title="Activity log"
            desc="All changes made this session — create, update, delete, and toggle events"
          >
            <AuditFeed />
          </Card>
        </div>

      </div>
    </div>
  );
}
