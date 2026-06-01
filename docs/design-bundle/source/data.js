/* Mock practice-operations data for Schissel Health Status.
   Realistic but entirely invented. No PHI. */
window.SCHISSEL_DATA = {
  practice: {
    name: "Schissel Health Status",
    entity: "Schissel Medicine, PLLC",
    homeState: "NH",
    today: "June 1, 2026",
  },

  kpis: [
    { id: "licenses", label: "Active state licenses", value: 9, sub: "3 in progress", trend: "up", trendLabel: "+2 this quarter", section: "licensing" },
    { id: "engagements", label: "Active engagements", value: 4, sub: "1 on hold", trend: "flat", trendLabel: "no change", section: "engagements" },
    { id: "revenue", label: "MTD revenue", value: "$48,200", sub: "vs $47,000 last mo.", trend: "up", trendLabel: "+12% MoM", section: "finances" },
    { id: "tasks", label: "Outstanding tasks", value: 4, sub: "2 due this week", trend: "down", trendLabel: "-3 this month", section: "compliance" },
  ],

  // status: active | progress | expiring | none.  imlc: member compact state
  states: [
    { code: "NH", name: "New Hampshire", status: "active", date: "2027-04-30", imlc: true, home: true },
    { code: "MA", name: "Massachusetts", status: "active", date: "2026-12-15", imlc: false },
    { code: "CA", name: "California", status: "active", date: "2026-12-31", imlc: false },
    { code: "TX", name: "Texas", status: "progress", date: "Submitted Apr 18", imlc: false },
    { code: "FL", name: "Florida", status: "expiring", date: "2026-07-20", imlc: false },
    { code: "NY", name: "New York", status: "progress", date: "Submitted May 02", imlc: false },
    { code: "IL", name: "Illinois", status: "active", date: "2027-01-31", imlc: true },
    { code: "GA", name: "Georgia", status: "expiring", date: "2026-08-10", imlc: true },
    { code: "NC", name: "North Carolina", status: "none", date: null, imlc: false },
    { code: "PA", name: "Pennsylvania", status: "progress", date: "Submitted May 19", imlc: true },
    { code: "WA", name: "Washington", status: "active", date: "2027-06-30", imlc: true },
    { code: "VA", name: "Virginia", status: "active", date: "2027-03-15", imlc: true },
    { code: "OH", name: "Ohio", status: "none", date: null, imlc: true },
    { code: "AZ", name: "Arizona", status: "active", date: "2027-02-28", imlc: true },
  ],

  // status: notstarted | submitted | review | approved
  payers: [
    { name: "Medicare (CMS)", type: "Government", status: "approved", date: "2026-02-10" },
    { name: "CAQH ProView", type: "Profile", status: "approved", date: "2025-12-01" },
    { name: "Availity", type: "Clearinghouse", status: "approved", date: "2026-01-22" },
    { name: "Teladoc Health", type: "Platform", status: "approved", date: "2026-03-05" },
    { name: "UnitedHealthcare", type: "Commercial", status: "review", date: "2026-05-12" },
    { name: "Cigna", type: "Commercial", status: "review", date: "2026-04-30" },
    { name: "Aetna", type: "Commercial", status: "submitted", date: "2026-05-20" },
    { name: "Amwell", type: "Platform", status: "submitted", date: "2026-05-18" },
    { name: "Blue Cross Blue Shield", type: "Commercial", status: "notstarted", date: null },
  ],

  finances: {
    months: [
      { m: "Jan", rev: 39000, exp: 14000 },
      { m: "Feb", rev: 42000, exp: 11200 },
      { m: "Mar", rev: 45000, exp: 16100 },
      { m: "Apr", rev: 51000, exp: 12800 },
      { m: "May", rev: 47000, exp: 12000 },
      { m: "Jun", rev: 48200, exp: 9000, partial: true },
    ],
    // current period expense classification
    expenseCategories: [
      { tag: "Insurance", label: "Malpractice insurance", amount: 5500 },
      { tag: "Licensing", label: "Licensing & enrollment", amount: 4200 },
      { tag: "Services", label: "Professional services", amount: 3100 },
      { tag: "Software", label: "Software & tools", amount: 2400 },
      { tag: "Education", label: "Education / CME", amount: 1800 },
      { tag: "Other", label: "Other", amount: 900 },
    ],
  },

  engagements: [
    { name: "Teladoc Health", model: "Async visits", volume: "62 visits MTD", rate: "$32 / visit", status: "active" },
    { name: "Amwell", model: "Scheduled video", volume: "18 hrs / wk", rate: "$120 / hr", status: "active" },
    { name: "Wheel", model: "On-demand", volume: "40 visits MTD", rate: "$28 / visit", status: "active" },
    { name: "SteadyMD", model: "Panel coverage", volume: "Retainer", rate: "$4,000 / mo", status: "active" },
    { name: "Sesame", model: "Direct cash visits", volume: "Paused", rate: "$45 / visit", status: "hold" },
  ],

  // done | progress | notstarted
  checklist: [
    { task: "Single-member PLLC formation", group: "Entity", status: "done", date: null },
    { task: "EIN from IRS", group: "Entity", status: "done", date: null },
    { task: "Business bank account", group: "Banking", status: "done", date: null },
    { task: "Malpractice insurance (occurrence)", group: "Insurance", status: "done", date: null },
    { task: "NPI Type 2 (organization)", group: "Identifiers", status: "done", date: null },
    { task: "Registered agent on file", group: "Entity", status: "done", date: null },
    { task: "HIPAA security risk assessment", group: "HIPAA", status: "progress", date: "2026-06-15" },
    { task: "BAAs with telehealth platforms (2 of 4)", group: "HIPAA", status: "progress", date: "2026-06-30" },
    { task: "HIPAA policies & procedures", group: "HIPAA", status: "notstarted", date: "2026-07-10" },
    { task: "Cyber liability insurance", group: "Insurance", status: "notstarted", date: "2026-07-15" },
  ],
};
