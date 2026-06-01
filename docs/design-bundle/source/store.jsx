/* Shared persisted stores + helpers for Schissel Health Status.
   A generic localStorage-backed store with React subscription, instantiated
   for licenses and payers so Overview and section screens stay in sync.
   Loaded after components.jsx, before overview/sections/licensing/credentialing. */
const { useState: _useState, useEffect: _useEffect } = React;

const uid = () => Math.random().toString(36).slice(2, 9);
const TODAY = new Date("2026-06-01T00:00:00");
const CYCLES = ["Annual", "Biennial", "Triennial"];

const STATUS_OPTS = [
  ["active", "Active", "ok"],
  ["progress", "In progress", "info"],
  ["expiring", "Expiring soon", "warn"],
  ["none", "Not licensed", "idle"],
];
const PAYER_STATUS_OPTS = [
  ["notstarted", "Not started", "idle"],
  ["submitted", "Submitted", "warn"],
  ["review", "In review", "info"],
  ["approved", "Approved", "ok"],
];

function daysUntil(dateStr) {
  if (!dateStr || !dateStr.includes("-")) return null;
  return Math.round((new Date(dateStr + "T00:00:00") - TODAY) / 864e5);
}
function fmtDays(d) {
  if (d == null) return "—";
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return "due today";
  if (d < 60) return `in ${d}d`;
  return `in ${Math.round(d / 30)} mo`;
}
function fmtDate(d) {
  if (!d || !d.includes("-")) return d || "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ---- generic store factory ---- */
function createStore(key, seedFn) {
  let state = null;
  const subs = new Set();
  const load = () => {
    try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch (e) {}
    return seedFn();
  };
  const ensure = () => (state === null ? (state = load()) : state);
  const commit = (next) => {
    state = next;
    try { localStorage.setItem(key, JSON.stringify(next)); } catch (e) {}
    subs.forEach((f) => f(next));
  };
  const useStore = () => {
    const [, force] = _useState(0);
    _useEffect(() => { const f = () => force((x) => x + 1); subs.add(f); return () => subs.delete(f); }, []);
    const set = (u) => { const cur = ensure(); commit(typeof u === "function" ? u(cur) : u); };
    return [ensure(), set];
  };
  return { useStore, get: ensure, reset: () => { try { localStorage.removeItem(key); } catch (e) {} state = null; subs.forEach((f) => f(load())); } };
}

/* ---- license reference-doc seed + normalizer ---- */
const LIC_SEED = {
  NH: { licenseNo: "MD-014872", issued: "2019-05-01", expires: "2027-04-30", cycle: "Biennial", fee: "$300",
    board: "NH Board of Medicine (OPLC)", boardUrl: "oplc.nh.gov/medicine",
    requirements: [
      { id: uid(), label: "100 hrs CME per biennial cycle (incl. 3 hrs opioid/pain mgmt)", done: true },
      { id: uid(), label: "Complete renewal in NH OPLC online portal", done: false },
      { id: uid(), label: "Pay $300 renewal fee", done: false },
      { id: uid(), label: "Confirm current mailing address & practice info", done: true }],
    documents: [
      { id: uid(), name: "NH renewal checklist (PDF)", note: "Drive › Licensing/NH" },
      { id: uid(), name: "CME tracking sheet", note: "CE Broker export — updated quarterly" }],
    notes: "Home state. Renewal window opens 60 days before expiration. OPLC processing ~5 business days." },
  CA: { licenseNo: "A-201845", issued: "2021-08-12", expires: "2026-12-31", cycle: "Biennial", fee: "$863",
    board: "Medical Board of California", boardUrl: "mbc.ca.gov",
    requirements: [
      { id: uid(), label: "50 hrs CME per 2-yr cycle", done: true },
      { id: uid(), label: "One-time pain mgmt & end-of-life CME on file", done: true },
      { id: uid(), label: "Pay $863 biennial renewal fee", done: false },
      { id: uid(), label: "Renew via BreEZe online portal", done: false }],
    documents: [
      { id: uid(), name: "BreEZe account credentials", note: "1Password › MBC" },
      { id: uid(), name: "Fingerprint (Live Scan) confirmation", note: "On file 2021" }],
    notes: "Highest renewal fee in footprint. Late fee +50% after expiration." },
  TX: { status: "progress", fee: "$478 (initial)", cycle: "Biennial",
    board: "Texas Medical Board", boardUrl: "tmb.texas.gov",
    requirements: [
      { id: uid(), label: "Application submitted via TMB portal", done: true },
      { id: uid(), label: "FCVS profile sent to TMB", done: true },
      { id: uid(), label: "Texas Jurisprudence Exam (JP) — pass ≥ 75", done: false },
      { id: uid(), label: "Fingerprint background check (IdentoGO)", done: false }],
    documents: [{ id: uid(), name: "FCVS profile ID", note: "fsmb.org/fcvs" },
      { id: uid(), name: "Application receipt", note: "Submitted Apr 18, 2026" }],
    notes: "Submitted Apr 18. Typical TMB processing 51–60 days once file is complete." },
  FL: { licenseNo: "ME-148201", issued: "2022-07-20", expires: "2026-07-20", cycle: "Biennial", fee: "$359",
    board: "Florida Board of Medicine", boardUrl: "flboardofmedicine.gov",
    requirements: [
      { id: uid(), label: "40 hrs CME per biennium (incl. 2 hrs medical errors)", done: false },
      { id: uid(), label: "2 hrs Florida laws & rules CME", done: false },
      { id: uid(), label: "Renew via MQA online services", done: false },
      { id: uid(), label: "Pay $359 renewal fee", done: false }],
    documents: [{ id: uid(), name: "MQA online services login", note: "" }],
    notes: "⚠ Expires soon — renew before Jul 20, 2026 to avoid inactive status." },
};
function normalizeLicense(s) {
  const seed = LIC_SEED[s.code] || {};
  const expires = seed.expires !== undefined ? seed.expires : (s.date && s.date.includes("-") ? s.date : "");
  return {
    code: s.code, name: (window.US_NAMES && window.US_NAMES[s.code]) || s.name || s.code,
    status: s.status || seed.status || "none", imlc: !!s.imlc, home: !!s.home,
    licenseNo: seed.licenseNo || "", issued: seed.issued || "", expires,
    cycle: seed.cycle || "Biennial", fee: seed.fee || "", board: seed.board || "", boardUrl: seed.boardUrl || "",
    requirements: seed.requirements || [], documents: seed.documents || [], notes: seed.notes || "",
  };
}

/* ---- payer reference-doc seed + normalizer ---- */
const PAYER_SEED = {
  "Medicare (CMS)": { providerId: "PTAN 4F2210", effectiveDate: "2026-02-10", revalidation: "2031-02-10",
    rep: "MAC: Novitas Solutions", portalUrl: "pecos.cms.hhs.gov",
    requirements: [
      { id: uid(), label: "CMS-855I (individual enrollment) approved", done: true },
      { id: uid(), label: "CMS-588 EFT enrollment", done: true },
      { id: uid(), label: "CMS-460 participation agreement", done: true },
      { id: uid(), label: "Track 5-yr revalidation (due 2031)", done: false }],
    documents: [{ id: uid(), name: "PECOS confirmation letter", note: "Drive › Credentialing/Medicare" }],
    notes: "PTAN active. Reassignment of benefits to PLLC on file." },
  "UnitedHealthcare": { effectiveDate: "", rep: "Provider Advocate: K. Ramirez", portalUrl: "uhcprovider.com",
    requirements: [
      { id: uid(), label: "CAQH profile attested & authorized to UHC", done: true },
      { id: uid(), label: "Signed participation agreement returned", done: false },
      { id: uid(), label: "W-9 (PLLC) submitted", done: true },
      { id: uid(), label: "EFT / ERA enrollment via Optum Pay", done: false }],
    documents: [{ id: uid(), name: "UHC contract draft", note: "Awaiting countersignature" }],
    notes: "In committee review. Advocate estimates 30–45 days to effective date." },
  "Aetna": { rep: "", portalUrl: "availity.com",
    requirements: [
      { id: uid(), label: "Application submitted via Availity", done: true },
      { id: uid(), label: "CAQH authorized to Aetna", done: true },
      { id: uid(), label: "Malpractice COI uploaded", done: false }],
    documents: [], notes: "Submitted May 20 via Availity. No analyst assigned yet." },
  "Blue Cross Blue Shield": {
    requirements: [
      { id: uid(), label: "Confirm correct BCBS plan / state entity (Anthem NH)", done: false },
      { id: uid(), label: "Start application via provider portal", done: false },
      { id: uid(), label: "CAQH authorized to BCBS", done: false }],
    documents: [], notes: "Not started. Prioritize — largest commercial volume in footprint." },
  "CAQH ProView": { effectiveDate: "2025-12-01", portalUrl: "proview.caqh.org",
    requirements: [
      { id: uid(), label: "Profile 100% complete", done: true },
      { id: uid(), label: "Re-attest every 120 days", done: false },
      { id: uid(), label: "Authorize all enrolling payers", done: true }],
    documents: [{ id: uid(), name: "CAQH Provider ID", note: "1Password › CAQH" }],
    notes: "Re-attestation drives every commercial enrollment — keep current." },
};
function normalizePayer(p) {
  const seed = PAYER_SEED[p.name] || {};
  return {
    id: p.id || uid(), name: p.name, type: p.type || "Commercial", status: p.status || "notstarted",
    date: p.date || "", effectiveDate: seed.effectiveDate || "", revalidation: seed.revalidation || "",
    providerId: seed.providerId || "", rep: seed.rep || "", portalUrl: seed.portalUrl || "",
    requirements: seed.requirements || [], documents: seed.documents || [], notes: seed.notes || "",
  };
}

const licenseStore = createStore("schissel_licenses_v2", () => window.SCHISSEL_DATA.states.map(normalizeLicense));
const payerStore = createStore("schissel_payers_v1", () => window.SCHISSEL_DATA.payers.map(normalizePayer));

/* ---- engagements / checklist / finances normalizers + stores ---- */
const ENG_STATUS_OPTS = [
  ["active", "Active", "ok"], ["hold", "On hold", "warn"],
  ["prospect", "Prospect", "info"], ["ended", "Ended", "idle"],
];
const CHK_STATUS_OPTS = [
  ["notstarted", "Not started", "idle"], ["progress", "In progress", "warn"], ["done", "Done", "ok"],
];
const ENG_MODELS = ["Async visits", "Scheduled video", "On-demand", "Panel / retainer", "Direct cash", "Other"];
const CHK_GROUPS = ["Entity", "Banking", "Insurance", "Identifiers", "HIPAA", "General"];

const ENG_SEED = {
  "Teladoc Health": { startDate: "2025-09-01", contact: "Provider Ops: J. Lee", portalUrl: "provider.teladoc.com", payTerms: "Net 15 · biweekly ACH",
    requirements: [
      { id: uid(), label: "Credentialed on Teladoc platform", done: true },
      { id: uid(), label: "Malpractice COI on file", done: true },
      { id: uid(), label: "Direct deposit / ACH set up", done: true },
      { id: uid(), label: "Platform clinical training complete", done: true }],
    documents: [{ id: uid(), name: "Master services agreement", note: "Drive › Engagements/Teladoc" },
      { id: uid(), name: "Rate exhibit A", note: "$32 / async visit" }],
    notes: "Steadiest volume. Payouts on the 1st & 15th." },
  "Amwell": { startDate: "2026-01-15", contact: "Network: M. Osei", portalUrl: "amwell.com", payTerms: "Net 30 · monthly",
    requirements: [
      { id: uid(), label: "Platform credentialing approved", done: true },
      { id: uid(), label: "Scheduling availability published", done: true },
      { id: uid(), label: "EFT enrollment", done: false }],
    documents: [{ id: uid(), name: "Independent contractor agreement", note: "" }],
    notes: "18 scheduled hrs/wk. Confirm EFT before next cycle." },
  "SteadyMD": { startDate: "2025-11-01", contact: "Clinician Success: R. Tan", portalUrl: "steadymd.com", payTerms: "Monthly retainer",
    requirements: [
      { id: uid(), label: "Panel coverage agreement signed", done: true },
      { id: uid(), label: "State coverage map confirmed", done: true }],
    documents: [{ id: uid(), name: "Retainer agreement", note: "$4,000/mo" }],
    notes: "Retainer covers async panel coverage across licensed states." },
  "Sesame": { startDate: "", contact: "", portalUrl: "sesamecare.com", payTerms: "Per-visit cash",
    requirements: [{ id: uid(), label: "Reactivate listing when capacity allows", done: false }],
    documents: [], notes: "Paused — revisit in Q3 when schedule opens up." },
};
function normalizeEngagement(e) {
  const seed = ENG_SEED[e.name] || {};
  return {
    id: e.id || uid(), name: e.name, model: e.model || "", volume: e.volume || "", rate: e.rate || "", status: e.status || "active",
    startDate: seed.startDate || "", contact: seed.contact || "", portalUrl: seed.portalUrl || "", payTerms: seed.payTerms || "",
    requirements: seed.requirements || [], documents: seed.documents || [], notes: seed.notes || "",
  };
}

const CHK_SEED = {
  "HIPAA security risk assessment": { owner: "Owner", requirements: [
      { id: uid(), label: "Inventory ePHI systems & data flows", done: true },
      { id: uid(), label: "Complete SRA Tool questionnaire (ONC)", done: false },
      { id: uid(), label: "Document remediation plan", done: false }],
    documents: [{ id: uid(), name: "ONC SRA Tool export", note: "healthit.gov/sra" }],
    notes: "Annual requirement. Last full assessment overdue — prioritize." },
  "BAAs with telehealth platforms (2 of 4)": { owner: "Owner", requirements: [
      { id: uid(), label: "Teladoc BAA executed", done: true },
      { id: uid(), label: "Amwell BAA executed", done: true },
      { id: uid(), label: "Wheel BAA executed", done: false },
      { id: uid(), label: "SteadyMD BAA executed", done: false }],
    documents: [{ id: uid(), name: "BAA folder", note: "Drive › Compliance/BAAs" }],
    notes: "Need BAA on file before sharing any ePHI with a platform." },
  "Cyber liability insurance": { owner: "Owner", requirements: [
      { id: uid(), label: "Get 2–3 quotes (tech E&O + cyber)", done: false },
      { id: uid(), label: "Confirm coverage limits ≥ $1M", done: false }],
    documents: [], notes: "Bundle with malpractice carrier if cheaper." },
};
function normalizeChecklist(c) {
  const seed = CHK_SEED[c.task] || {};
  return {
    id: c.id || uid(), task: c.task, group: c.group || "General", status: c.status || "notstarted", date: c.date || null,
    owner: seed.owner || "", requirements: seed.requirements || [], documents: seed.documents || [], notes: seed.notes || "",
  };
}
const engagementStore = createStore("schissel_engagements_v2", () => window.SCHISSEL_DATA.engagements.map(normalizeEngagement));
const checklistStore = createStore("schissel_checklist_v2", () => window.SCHISSEL_DATA.checklist.map(normalizeChecklist));

/* ---- finances: transaction ledger + history + estimated taxes ---- */
const EXPENSE_CATEGORIES = ["Insurance", "Licensing & enrollment", "Professional services", "Software & tools", "Education / CME", "Marketing", "Other"];
const INCOME_CATEGORIES = ["Platform payout", "Reimbursement", "Retainer", "Direct pay", "Other"];
const MONTH_Q = { Jan: "Q1", Feb: "Q1", Mar: "Q1", Apr: "Q2", May: "Q2", Jun: "Q2", Jul: "Q3", Aug: "Q3", Sep: "Q3", Oct: "Q4", Nov: "Q4", Dec: "Q4" };

const FIN_SEED = {
  currentMonth: "Jun",
  history: [
    { m: "Jan", rev: 39000, exp: 14000 }, { m: "Feb", rev: 42000, exp: 11200 },
    { m: "Mar", rev: 45000, exp: 16100 }, { m: "Apr", rev: 51000, exp: 12800 },
    { m: "May", rev: 47000, exp: 12000 },
  ],
  ledger: [
    { id: uid(), date: "2026-06-02", type: "income", category: "Platform payout", source: "Teladoc Health", amount: 18400, note: "62 async visits" },
    { id: uid(), date: "2026-06-05", type: "income", category: "Platform payout", source: "Amwell", amount: 12300, note: "scheduled video" },
    { id: uid(), date: "2026-06-09", type: "income", category: "Retainer", source: "SteadyMD", amount: 4000, note: "monthly panel retainer" },
    { id: uid(), date: "2026-06-12", type: "income", category: "Platform payout", source: "Wheel", amount: 8500, note: "on-demand" },
    { id: uid(), date: "2026-06-14", type: "income", category: "Reimbursement", source: "Medicare (CMS)", amount: 5000, note: "" },
    { id: uid(), date: "2026-06-01", type: "expense", category: "Insurance", source: "MedPro Group", amount: 2750, note: "malpractice premium" },
    { id: uid(), date: "2026-06-03", type: "expense", category: "Licensing & enrollment", source: "Texas Medical Board", amount: 1200, note: "TX application + JP exam" },
    { id: uid(), date: "2026-06-06", type: "expense", category: "Professional services", source: "Bench Bookkeeping", amount: 1500, note: "bookkeeping + payroll" },
    { id: uid(), date: "2026-06-08", type: "expense", category: "Software & tools", source: "EHR + telehealth stack", amount: 1150, note: "EHR, e-fax, scheduling" },
    { id: uid(), date: "2026-06-10", type: "expense", category: "Education / CME", source: "CME course", amount: 900, note: "opioid / pain CME" },
    { id: uid(), date: "2026-06-13", type: "expense", category: "Other", source: "Misc", amount: 1500, note: "registered agent, postage" },
  ],
  taxRate: 0.27,
  taxPayments: [
    { id: uid(), label: "Q1 2026", due: "2026-04-15", paid: true, paidAmount: 22900 },
    { id: uid(), label: "Q2 2026", due: "2026-06-15", paid: false, paidAmount: 0 },
    { id: uid(), label: "Q3 2026", due: "2026-09-15", paid: false, paidAmount: 0 },
    { id: uid(), label: "Q4 2026", due: "2027-01-15", paid: false, paidAmount: 0 },
  ],
};
const financeStore = createStore("schissel_finances_v2", () => JSON.parse(JSON.stringify(FIN_SEED)));

/* ---- practice settings store ---- */
const SETTINGS_SEED = {
  name: window.SCHISSEL_DATA.practice.name,
  entity: window.SCHISSEL_DATA.practice.entity,
  homeState: window.SCHISSEL_DATA.practice.homeState,
  npi: "1659873024",
  ein: "88-3091756",
  email: "ops@schisselhealth.com",
  phone: "(603) 555-0142",
  timezone: "America/New_York (ET)",
  notifications: { licenseRenewals: true, recredentialing: true, complianceDue: true, weeklyDigest: false, leadDays: 30 },
};
const settingsStore = createStore("schissel_settings_v1", () => JSON.parse(JSON.stringify(SETTINGS_SEED)));

const ALL_STORE_KEYS = ["schissel_licenses_v2", "schissel_payers_v1", "schissel_engagements_v2", "schissel_checklist_v2", "schissel_finances_v2", "schissel_settings_v1"];
const ALL_STORES = () => [licenseStore, payerStore, engagementStore, checklistStore, financeStore, settingsStore];

function finMTD(fin) {
  const rev = fin.ledger.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const exp = fin.ledger.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  return { rev, exp, net: rev - exp };
}
function finMonths(fin) {
  const { rev, exp } = finMTD(fin);
  return [...fin.history, { m: fin.currentMonth, rev, exp, partial: true }];
}
function finExpenseByCategory(fin) {
  const map = {};
  fin.ledger.filter(t => t.type === "expense").forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
  return Object.entries(map).map(([label, amount]) => ({ tag: label.split(" ")[0], label, amount })).sort((a, b) => b.amount - a.amount);
}
function finQuarterNet(fin, q) {
  return finMonths(fin).filter(m => MONTH_Q[m.m] === q.slice(0, 2)).reduce((a, m) => a + (m.rev - m.exp), 0);
}
function finYTDNet(fin) { return finMonths(fin).reduce((a, m) => a + (m.rev - m.exp), 0); }

Object.assign(window, {
  uid, TODAY, CYCLES, STATUS_OPTS, PAYER_STATUS_OPTS, ENG_STATUS_OPTS, CHK_STATUS_OPTS, ENG_MODELS, CHK_GROUPS,
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, MONTH_Q,
  daysUntil, fmtDays, fmtDate,
  createStore, normalizeLicense, normalizePayer, normalizeEngagement, normalizeChecklist,
  finMTD, finMonths, finExpenseByCategory, finQuarterNet, finYTDNet,
  licenseStore, payerStore, engagementStore, checklistStore, financeStore, settingsStore,
  ALL_STORE_KEYS, ALL_STORES,
  useLicenses: licenseStore.useStore, usePayers: payerStore.useStore,
  useEngagements: engagementStore.useStore, useChecklist: checklistStore.useStore, useFinances: financeStore.useStore,
  useSettings: settingsStore.useStore,
});
