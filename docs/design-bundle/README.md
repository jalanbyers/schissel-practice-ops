# Handoff: Schissel Health Status — Practice Operations Dashboard

## Overview
A back-office operations dashboard for a solo telehealth physician practice (single-member PLLC). It is **not** a clinical or patient-facing tool and stores **no PHI**. It tracks the business side of running a multi-state telemedicine practice:

- **Multi-state medical licensing** (50 states + DC) with renewal dates and IMLC compact eligibility
- **Credentialing & payer enrollment** (government, commercial, telehealth platforms)
- **Engagements** — 1099 contracts / telehealth platforms with volume & rate
- **Finances** — income/expense ledger, revenue-vs-expense trend, quarterly estimated-tax set-asides
- **Compliance & setup** — entity, banking, HIPAA, insurance readiness checklist
- **Settings** — practice profile, reminders, local data export/reset

The app is a left-sidebar **Overview** dashboard that drills into five workspace sections plus Settings. Each workspace follows the same pattern: summary stat cards → a list/grid of records → a right-hand **slide-over drawer** to view and edit a record's "living reference doc."

---

## About the Design Files
The files in `source/` are a **design reference built as an HTML/React prototype** — they show the intended look, layout, and interaction behavior. They are **not** production code to lift directly. The prototype runs entirely in the browser with:

- React 18 loaded from a CDN and **in-browser Babel** transpiling `.jsx` at runtime (fine for a prototype, never for production)
- All data persisted to **`localStorage`** (no backend)

**Your task:** recreate these designs in the target codebase's real environment — using its existing framework, component library, styling system, state management, routing, and data layer. If no codebase exists yet, choose an appropriate stack (e.g. React + TypeScript + Vite, a real component lib, a proper data layer) and implement there. Treat the HTML/CSS as the source of truth for *appearance and behavior*, not architecture.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, status semantics, component states, and interactions are all specified here and present in the prototype. Recreate the UI faithfully — exact tokens are listed below and in `source/styles.css`. Where this README and the CSS disagree, **the CSS wins** (it is the rendered artifact).

---

## Running the prototype
Open `source/Schissel Health Dashboard.html` in a browser (it loads React/Babel from a CDN, so it needs network access on first load). State persists in `localStorage`; **Settings → Reset to sample data** clears it. The script load order in the HTML matters — see [Architecture](#architecture--file-map).

---

## Design Tokens
All tokens are CSS custom properties defined in `source/styles.css` under `:root`, with overrides for `[data-density="dense"]` and `[data-theme="dark"]`. Reproduce them as your design-system tokens.

### Color — light theme (default)
| Token | Value | Use |
|---|---|---|
| `--primary` | `#0d7d7d` (teal)* | Primary actions, active nav, brand, accents |
| `--primary-700` | `#0a6363` | Primary hover, active-nav text |
| `--primary-50` | `#e6f2f2` | Active nav bg, KPI icon bg, avatar bg |
| `--primary-tint` | `#f1f8f8` | Nav hover, tag bg, subtle fills |
| `--bg` | `#f4f7f8` | App background |
| `--surface` | `#ffffff` | Cards, sidebar, drawers |
| `--surface-2` | `#fafcfc` | Row hover, drawer footer, inset wells |
| `--border` | `#e3eaec` | Hairlines, card borders |
| `--border-strong` | `#d2dcde` | Emphasized borders, "not licensed" accent |
| `--ink` | `#182426` | Primary text |
| `--ink-2` | `#4a5a5d` | Secondary text |
| `--ink-3` | `#7c8c8f` | Tertiary / meta / placeholder text |

\* The prototype's default Tweak ships with `--primary` set to `#2563a8` (clinical blue) via `TWEAK_DEFAULTS` in `app.jsx`; the CSS file's base value is teal `#0d7d7d`. Pick one as your brand primary — **clinical blue `#2563a8` is the intended shipped default.**

### Color — status (semantic only; never decorative)
| Token | Text | Background | Meaning |
|---|---|---|---|
| `--ok` / `--ok-bg` | `#15803d` | `#e7f4ec` | Active / Approved / Done / income |
| `--warn` / `--warn-bg` | `#b45309` | `#fbf0df` | Expiring soon / Submitted / In progress / On hold |
| `--info` / `--info-bg` | `#1d4ed8` | `#e8eefb` | In progress / In review / Prospect |
| `--bad` / `--bad-bg` | `#b91c1c` | `#fbe9e9` | Overdue / destructive / danger zone |
| `--idle` / `--idle-bg` | `#6b7a7d` | `#eef2f3` | Not licensed / Not started / Ended / neutral |

### Selectable brand primaries (Tweaks palette)
Defined in `app.jsx` as `PRIMARIES` — each is a `{primary, p700, p50, tint}` set:
- Teal `#0d7d7d`
- Slate blue `#3a5a8c`
- Clinical blue `#2563a8` (shipped default)
- Evergreen `#1f6f5c`

### Typography
- **Sans (UI):** `"IBM Plex Sans"`, fallback `system-ui, sans-serif`. Default. Selectable alternatives via Tweaks: Public Sans, Hanken Grotesk, Source Sans 3.
- **Mono (numbers/codes/dates):** `"IBM Plex Mono"`, fallback `ui-monospace, monospace`. Used for all figures, state codes, dates, IDs — anything tabular. `.mono` also sets `font-feature-settings: "tnum" 1`.
- Loaded from Google Fonts (weights 400/500/600/700).

Type scale (comfortable density):
| Role | Size / weight |
|---|---|
| Section title (`.sec-title`) | 23px / 600, `-0.02em` |
| Topbar crumb (`.crumb`) | 18px / 600 |
| Drawer title | 20px / 600 |
| KPI value | 30px / 600 mono, `-0.02em` |
| Card title | 13.5px / 600 |
| Body | 14px / 400, line-height 1.45 |
| Labels / meta | 11–12.5px, `--ink-3` |
| Uppercase eyebrows | 10.5–11px, `letter-spacing .04–.08em`, uppercase, 600 |

### Spacing, radius, shadow (comfortable → dense)
| Token | Comfortable | Dense |
|---|---|---|
| `--pad-card` | 22px | 16px |
| `--gap-grid` | 18px | 12px |
| `--row-h` (table row) | 44px | 36px |
| `--fs-body` | 14px | 13px |
| `--radius` / `--radius-sm` | 12 / 8px | 10 / 8px |

- `--shadow-card`: `0 1px 2px rgba(16,40,42,.04), 0 1px 3px rgba(16,40,42,.05)`
- `--shadow-hover`: `0 6px 16px rgba(16,40,42,.10), 0 2px 4px rgba(16,40,42,.06)`

### Dark theme
`[data-theme="dark"]` swaps surfaces to a desaturated teal-black (`--bg #0e1718`, `--surface #162123`), lightens ink, and brightens status colors (`--ok #4ade80`, etc.). See `styles.css`.

---

## App Shell / Layout
CSS Grid: `grid-template-columns: 248px 1fr` (dense: `224px`); full-viewport height, `overflow: hidden`. Two regions:

### Sidebar (`.sidebar`, 248px, `--surface`, right hairline)
- **Brand block**: square `--primary` mark (34px, 9px radius) showing the practice name's first initial, then practice name (14/600) + legal entity (11px, `--ink-3`). Both come from the live settings store, so editing the profile updates the sidebar.
- **Nav** — section label "Practice" then items: **Overview, Licensing, Credentialing, Engagements, Finances, Compliance**; then "Account" label and **Settings**. Each item: 17px stroke icon + label + optional right-aligned mono count badge.
  - Counts: Licensing = total states; Credentialing = payers not yet approved; Engagements = active count; Compliance = tasks not done.
  - States: hover → `--primary-tint` bg; active → `--primary-50` bg + `--primary-700` text + 600.
- **Footer**: profile chip (avatar "DS" + "Operations / Back office"). Pinned to bottom (`margin-top: auto`).

### Main column (`.main`)
- **Topbar** (62px, translucent `--surface` + `backdrop-filter: blur(6px)`, bottom hairline): a search field (280px, placeholder "Search states, payers, tasks…"), then right-aligned: mono date ("June 1, 2026"), a notifications icon-button, a settings icon-button. (Search & top-bar buttons are presentational in the prototype.)
- **Scroll region** (`.scroll`, `padding: 24px 26px 60px`): renders the active route.

### 12-column content grid
`.grid { display:grid; grid-template-columns: repeat(12,1fr); gap: var(--gap-grid) }`. Column spans via `.col-3/.col-4/.col-5/.col-6/.col-7/.col-8/.col-12`. Cards declare their own span.

### Responsive
- ≤1080px: sidebar collapses to a 72px icon rail (labels/counts/brand text hidden); `col-3`→span 6, most others→span 12; search shrinks to 180px.
- ≤720px: `col-3`→span 12; top search hidden; drawer goes full-width.

---

## Shared Components
(Source: `components.jsx`)

### `Card`
`.card` — `--surface`, 1px `--border`, `--radius`, `--pad-card`, `--shadow-card`, flex-column. Optional header (`.card-head`) = title (13.5/600) + desc (12px `--ink-3`) on the left, optional `headRight` node, optional right-aligned `cta`. When `onClick` is set, the card gets `.clickable`: cursor pointer, hover raises shadow to `--shadow-hover`, `translateY(-1px)`, border → `--border-strong`, and the CTA fades/slides in (`opacity 0→1`, `translateX(-4px→0)`). Keyboard accessible (`role=button`, `tabIndex=0`, Enter activates).

### `StatusPill` (`.pill`)
Rounded-999px chip, 11.5/600, with a 6px leading status dot. Variants `.ok/.warn/.bad/.info/.idle` set bg + text + dot color from the status tokens. **Status color is reserved exclusively for status** — never use these hues decoratively.

### KPI card (`.kpi`)
Label (12.5px `--ink-2`) + right icon chip (32px, `--primary-50` bg). Value 30px/600 mono. Footer: a trend line (`.trend` mono 600, e.g. "↑ +12% MoM") + a sub line (`--ink-3`). On Overview the four KPI cards are clickable and navigate to their section.

### `EmptyState` (`.empty`)
Centered icon tile (46px) + title (13.5/600 `--ink-2`) + desc (max 280px) + optional primary `.empty-btn`. Used when a list is empty or for "Preview empty states" Tweak.

### Buttons (`.btn`)
Base: 13/600, 9px radius, `9px 14px`, 1px border, `--surface`. Variants: `.primary` (filled `--primary`, white text), `.danger` (red text/border, `--bad-bg` hover), `.ghost` (borderless, subtle hover). Icon buttons `.icon-btn` are 36px squares.

### Slide-over Drawer (`.drawer`)
The core editing surface, shared in spirit across Licensing / Credentialing / Engagements / Compliance / Finances.
- **Scrim** `.scrim`: fixed full-screen `rgba(12,28,30,.42)`, fades in `.18s`, click to dismiss.
- **Panel** `.drawer`: fixed right, 480px wide (full-width ≤720px), `--surface`, `-12px 0 40px` shadow; slides in `.24s cubic-bezier(.2,.7,.3,1)`.
- **Head** (`.drawer-head`): eyebrow + title (record code/name) + status badges; close "×" icon-button (a rotated plus icon).
- **Body** (`.drawer-body`, scrollable): grouped sections (`.dgroup` with uppercase `.dgroup-title`). Forms use `.field-grid` (2-col), `.field` (label 11/600 `--ink-3` + `.input`/`.textarea`/`select.input`). Inputs focus to `--primary` border + 3px primary-tinted focus ring.
- **Foot** (`.drawer-foot`, `--surface-2`): left **Delete** (`.btn.danger`, only when editing), spacer, **Cancel** + **Save/Add** (`.btn.primary`, disabled until valid).

### Reusable drawer sub-sections
- **`ReqSection`** — an editable requirements checklist: each row = a toggle check (`.req-check`, fills `--primary` when done), an inline text input (strikethrough when done), and a delete button; header shows "N/M done" and an **Add** ghost button.
- **`DocSection`** — editable reference-document list: each row = a doc icon, a name input + a "link / where it lives" note input, and delete. **Add** ghost button.
- **`SegStatus`** — segmented status selector (grid of buttons); selected button takes its status color (bg/border/text) and shows a colored dot.

### Icons
A small custom 24×24 stroke icon set in `components.jsx` (`Icon.overview/licensing/credentialing/engagements/finances/compliance/settings/search/bell/plus/arrow/check/calendar/dollar/list/building`). Stroke width ~1.7, round caps. Replace with your codebase's icon library (e.g. Lucide) — these map cleanly to common shield/clipboard/briefcase/bar-chart/gear/bell glyphs. The close button reuses `Icon.plus` rotated 45°.

---

## Screens / Views

### 1. Overview (`overview.jsx` → `Overview`)
Single 12-col grid, all cards clickable to drill in:
1. **KPI row** — four `col-3` KPI cards computed live from the stores: Active state licenses (+ in-progress sub), Active engagements (+ on hold), MTD revenue (vs last month), Outstanding tasks (+ due soon).
2. **Multi-state licensing** (`col-7`) — the footprint visualized as a **geographic tile-grid map** of all 50 states + DC (`.tilemap`, `repeat(11,1fr)`). Each tile is positioned at its real-ish row/col (`US_GRID` array). Tile color = license status (left accent bar + tinted bg via `.s-active/.s-progress/.s-expiring/.s-none`); a small dot marks IMLC-eligible states; the home state gets a ★. A legend maps colors → Active / In progress / Expiring ≤90d / Not licensed / IMLC-eligible. (A List view variant `LicenseList` exists, toggled by the "Licensing view" Tweak.)
3. **Credentialing & payer enrollment** (`col-5`) — compact table: payer/platform (+ type subline), status pill, updated date. Empty-state when "Preview empty states" is on.
4. **Finances** (`col-7`) — `BarChart` of revenue vs. expenses over 6 months (paired bars; current month hatched/`.partial`) + `ExpenseBreakdown` (a stacked proportion bar + per-category list with color dot, tag, label, amount). Legend in header.
5. **Active engagements** (`col-5`) — roster rows: monogram logo, name + model, right-aligned volume + rate, status pill.
6. **Setup & compliance** (`col-12`) — two-column checklist; header shows a % progress bar ("N of M complete"). Each row: status check box (done = filled primary w/ check; in-progress = warn dot), task label (strikethrough when done), group tag, and due date (turns `--warn` when <14 days out).

### 2. Licensing (`licensing.jsx` → `LicensingSection`)
- **Toolbar**: "Find a state…" search + **Add state** primary button.
- **4 stat cards** (Active / In progress / Expiring soon / Not licensed) — each is a **toggle filter**; selected card gets a primary ring (`.sel`) and filters the renewals list.
- **Footprint** (`col-7`): the same interactive tile-map; **click any state tile** to open its drawer (existing state → edit; unlicensed state → prefilled "add" drawer with status "in progress").
- **Upcoming renewals** (`col-5`): licenses with a real renewal date, soonest first, each row showing code, name, "renews {date}", and a days-until badge (`--bad` <30d, `--warn` <90d). Click a row to open its drawer. Empty-state when none match the filter.
- **License drawer** (`LicenseDrawer`): Status segmented control; **Key facts** (license #, fee, issued/expires dates, renewal cycle [Annual/Biennial/Triennial], IMLC eligible, board, board URL; "Add" mode also has a state `<select>` excluding already-added states); **Renewal requirements** (`ReqSection`); **Reference documents** (`DocSection`); **Notes** textarea. Save requires a state code. Delete removes the license.

### 3. Credentialing (`credentialing.jsx` → `CredentialingSection`)
Same pattern keyed on payers. Stat filters use `PAYER_STATUS_OPTS` (Not started / Submitted / In review / Approved). Sorted review→submitted→notstarted→approved. Drawer fields include payer **type** (Commercial/Government/Platform/Clearinghouse/Profile/Other), provider ID, effective date, revalidation date, rep, portal URL, plus requirements/documents/notes. Payer **types** list: see `PAYER_TYPES`.

### 4. Engagements (`engagements.jsx` → `EngagementsSection`)
Keyed on 1099 contracts/platforms. Stat filters `ENG_STATUS_OPTS` (Active / On hold / Prospect / Ended). Drawer captures model (`ENG_MODELS`: Async visits, Scheduled video, On-demand, Panel/retainer, Direct cash, Other), volume, rate, start date, contact, portal URL, pay terms, plus onboarding requirements/documents/notes.

### 5. Finances (`finances.jsx` → `FinancesInner`)
- **Toolbar**: **Log income** + **Log expense** (primary).
- **4 KPI cards**: MTD revenue, MTD expenses, MTD net (+ margin %), Set aside YTD (net × tax rate).
- **Revenue vs. expenses** (`col-7`): `BarChart` (history + current month derived from the ledger) with 6-month Revenue/Expenses/Net totals beneath.
- **Expenses by category** (`col-5`): `ExpenseBreakdown` derived from ledger expense rows.
- **Ledger** (`col-7`): table of all transactions (date, source w/ income/expense dot + note, category tag, signed amount — green `+` for income, neutral `−` for expense). Click a row to edit in the **transaction drawer** (type toggle income/expense, date, amount, source/vendor, category select [income vs expense category lists], note). Save requires amount > 0 and a source.
- **Estimated taxes** (`col-5`): a rate segmented control (22% / 27% / 30%), YTD net income, and the four quarters — each showing due date, recommended set-aside (net × rate, or "—" when no net yet), and a **Mark paid / ✓ Paid** toggle. Disclaimer line: estimate only, confirm with accountant.

### 6. Compliance (`compliance.jsx` → `ComplianceSection`)
Keyed on setup/compliance tasks. A "Readiness" % KPI + status stat filters (`CHK_STATUS_OPTS`: Not started / In progress / Done). Rows sort by status then due date. **Quick toggle**: clicking a task's check box flips done/not-done without opening the drawer. Drawer captures owner, sub-step checklist, documents, notes. Groups: `CHK_GROUPS` (Entity, Banking, Insurance, Identifiers, HIPAA, General).

### 7. Settings (`settings.jsx` → `SettingsSection`)
- **Practice profile** (`col-7`): editable name, legal entity, home state (select), timezone, NPI (mono), EIN (mono), email, phone. Dirty-tracked Save/Discard; shows a "Saved" tag. **Editing name/entity updates the sidebar live.**
- **Reminders** (`col-5`): four toggle switches (license renewals, re-credentialing, compliance tasks, weekly digest) + a lead-time segmented control (14/30/60/90 days).
- **Data & privacy** (`col-12`): note that all data is local (no server, no PHI); **Export JSON** (downloads a backup of every store); **Reset to sample data** (danger zone, two-step confirm → clears all stores back to seed).

---

## Interactions & Behavior
- **Routing**: hash-based (`location.hash`), state in `App` (`route`). Navigating resets the scroll region to top. Default route `overview`.
- **Drill-in**: Overview KPI cards and section cards navigate; clicking a record opens its right slide-over **drawer** (scrim + slide animation described above). Esc/scrim/Cancel/× all close.
- **Drawers** edit a deep-cloned draft; **Save** commits to the store (persisting to localStorage) and keeps the drawer open on the saved record; **Delete** removes and closes.
- **Stat-card filters** (Licensing/Credentialing/Engagements/Compliance): click to filter the list to that status; click again to clear. Selected card shows a primary ring.
- **Search** inside each workspace filters its list live by name/code/type.
- **Inline edits**: requirement checkboxes, doc name/note inputs, compliance quick-toggle, tax "Mark paid" — all write straight to the store.
- **Animations**: scrim fade `.18s`; drawer slide `.24s` cubic-bezier(.2,.7,.3,1); card hover lift `.15s`; bars/progress grow `.4–.5s ease`; nav/button color transitions `.12s`.
- **Cross-screen sync**: Overview reads the same stores, so any edit in a workspace (or the Settings profile) reflects immediately on Overview and the sidebar.

---

## State Management
The prototype uses a tiny custom store factory (`createStore(key, seedFn)` in `store.jsx`): a singleton value + a `Set` of subscribers + localStorage persistence, exposed as a `useStore()` hook returning `[value, setValue]` (setter accepts a value or updater fn). Six stores:

| Hook | localStorage key | Holds |
|---|---|---|
| `useLicenses` | `schissel_licenses_v2` | state licenses (w/ reference docs) |
| `usePayers` | `schissel_payers_v1` | payer/platform enrollments |
| `useEngagements` | `schissel_engagements_v2` | 1099 engagements |
| `useChecklist` | `schissel_checklist_v2` | compliance/setup tasks |
| `useFinances` | `schissel_finances_v2` | ledger + history + tax payments |
| `useSettings` | `schissel_settings_v1` | practice profile + notification prefs |

Seed data comes from `window.SCHISSEL_DATA` (`data.js`) run through per-store **normalizer** functions that attach richer "reference doc" detail (`LIC_SEED`, `PAYER_SEED`, `ENG_SEED`, `CHK_SEED`, `FIN_SEED`, `SETTINGS_SEED` in `store.jsx`). **In a real app, replace these stores with your data layer** (API + server state cache such as TanStack Query, or your app's store) and treat the seed objects as fixture/shape references.

### Derived finance helpers (`store.jsx`)
`finMTD` (sum ledger income/expense/net), `finMonths` (history + current month derived from ledger, current flagged `partial`), `finExpenseByCategory`, `finQuarterNet`, `finYTDNet`. Tax recommendation = `quarterNet × taxRate`.

### Tweak state (`app.jsx`, `TWEAK_DEFAULTS`)
Design-time controls (not end-user settings): primary color, typeface, density (Comfortable/Dense), Licensing view (Tiles/List), dark surface, preview empty states. These set `data-density` / `data-theme` attributes and CSS variables on `<html>`. **For production, drop the Tweaks panel** — pick one primary, one typeface, and a single density, and wire dark mode to your app's theme system if desired.

---

## Data Model (shapes to mirror)
From `store.jsx` normalizers — use as the canonical record shapes:

- **License**: `{ code, name, status: active|progress|expiring|none, imlc:boolean, home:boolean, licenseNo, issued, expires, cycle: Annual|Biennial|Triennial, fee, board, boardUrl, requirements:[{id,label,done}], documents:[{id,name,note}], notes }`
- **Payer**: `{ id, name, type, status: notstarted|submitted|review|approved, date, effectiveDate, revalidation, providerId, rep, portalUrl, requirements[], documents[], notes }`
- **Engagement**: `{ id, name, model, volume, rate, status: active|hold|prospect|ended, startDate, contact, portalUrl, payTerms, requirements[], documents[], notes }`
- **Checklist task**: `{ id, task, group, status: notstarted|progress|done, date, owner, requirements[], documents[], notes }`
- **Finances**: `{ currentMonth, history:[{m,rev,exp}], ledger:[{id,date,type: income|expense, category, source, amount, note}], taxRate, taxPayments:[{id,label,due,paid,paidAmount}] }`
- **Settings**: `{ name, entity, homeState, npi, ein, email, phone, timezone, notifications:{licenseRenewals,recredentialing,complianceDue,weeklyDigest,leadDays} }`

> All names, IDs (NPI/EIN), figures, and payer names in the seed are **invented sample data** — no real practice or PHI. Replace with real data sources.

---

## Architecture / File Map
Everything is in `source/`. Load order (from the HTML) is significant — `data.js` first, then `components.jsx`, `store.jsx`, then screens, then `app.jsx` last. Section files (`licensing/credentialing/engagements/compliance/finances/settings.jsx`) **override** the placeholder stubs registered in `sections.jsx` via `window.SECTIONS`.

| File | Role |
|---|---|
| `Schissel Health Dashboard.html` | Shell: fonts, CSS link, CDN React/Babel, ordered script tags, `#root` |
| `styles.css` | **All design tokens + every component style** — the styling source of truth |
| `data.js` | `window.SCHISSEL_DATA` seed (practice, KPIs, states, payers, finances, engagements, checklist) |
| `components.jsx` | Icons, `StatusPill`, `Card`, `EmptyState`, `ReqSection`, `DocSection`, `SegStatus`, status maps, currency helpers |
| `store.jsx` | `createStore` factory, six stores + hooks, normalizers/seeds, finance helpers, date/format helpers |
| `overview.jsx` | Overview dashboard + tile-map, bar chart, expense breakdown, KPI row, checklist |
| `sections.jsx` | `SectionHead` + placeholder section stubs (overridden by the full sections) |
| `licensing.jsx` | Licensing workspace + `LicenseDrawer` |
| `credentialing.jsx` | Credentialing workspace + payer drawer |
| `engagements.jsx` | Engagements workspace + engagement drawer |
| `compliance.jsx` | Compliance workspace + task drawer (with quick-toggle) |
| `finances.jsx` | Finances workspace + `TxDrawer` (ledger, tax set-asides) |
| `settings.jsx` | Settings (profile, reminders, data export/reset) |
| `app.jsx` | `App` shell: Sidebar, TopBar, routing, theme/density/brand wiring, Tweaks panel |
| `tweaks-panel.jsx` | Design-time Tweaks panel scaffold (omit in production) |

## Assets
No external images or raster assets. All iconography is inline SVG (`components.jsx`); fonts are Google Fonts (IBM Plex Sans/Mono + the three alternates). Swap icons for your icon library and self-host or load fonts per your app's conventions.

## Implementation notes / gotchas
- **In-browser Babel + CDN React + `window.*` globals are prototype-only.** Rebuild as proper modules/components with real imports.
- **Status color discipline**: the five status hues are semantic. Don't reuse them for decoration; use `--primary` and neutrals for everything else.
- **Mono for figures**: keep IBM Plex Mono (with tabular numerals) for all numbers, codes, IDs, and dates so columns align.
- **The map is a tile-grid, not a real geographic SVG.** `US_GRID` in `overview.jsx` holds `[stateCode, row, col]` placements; reuse that array rather than redrawing.
- **Pick one primary + density + theme** for production (the Tweaks variability is a design-exploration affordance, not a shipping feature).
- **No PHI / no backend by design** in the prototype — wire to your real, secured data layer; this is a business-ops tool, keep clinical/patient data out.
