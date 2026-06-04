import type { StateStatus } from './mock-data';

export type RenewalCycle = 'Annual' | 'Biennial' | 'Triennial';

export interface Requirement {
  id: string;
  label: string;
  done: boolean;
}

export interface LicenseDoc {
  id: string;
  name: string;
  note: string;
}
export interface LicenseRecord {
  code: string;
  name: string;
  status: StateStatus;
  imlc: boolean;
  home: boolean;
  // dates
  date: string | null;
  expires: string;
  issued: string;
  // facts
  licenseNo: string;
  cycle: RenewalCycle;
  applicationFee: string;   // ← new: initial application fee
  fee: string;              // renewal fee
  timeline: string;         // ← new: e.g. "8–12 weeks"
  cmeHours: number | null;  // ← new: CME hours required per cycle
  board: string;
  boardUrl: string;
  // telehealth
  telehealthNotes: string;  // ← new: state-specific telehealth rules
  // sub-docs
  requirements: Requirement[];
  documents: LicenseDoc[];
  notes: string;
}

export const LICENSE_STATUS_OPTS: [string, string, string][] = [
  ['active',   'Active',        'ok'],
  ['progress', 'In progress',   'info'],
  ['expiring', 'Expiring soon', 'warn'],
  ['none',     'Not licensed',  'idle'],
];

export const RENEWAL_CYCLES: RenewalCycle[] = ['Annual', 'Biennial', 'Triennial'];

// ─── Compliance ──────────────────────────────────────────────────────────────

export type CheckStatus  = 'notstarted' | 'progress' | 'done';
export type ChecklistGroup = 'Entity' | 'Banking' | 'Insurance' | 'Identifiers' | 'HIPAA' | 'General';

export interface ChecklistTask {
  id: string;
  task: string;
  group: ChecklistGroup;
  status: CheckStatus;
  date: string | null;   // ISO due date, or null
  owner: string;
  requirements: Requirement[];
  documents: LicenseDoc[];
  notes: string;
}

export const CHK_STATUS_OPTS: [string, string, string][] = [
  ['notstarted', 'Not started', 'idle'],
  ['progress',   'In progress', 'warn'],
  ['done',       'Done',        'ok'],
];

export const CHK_GROUPS: ChecklistGroup[] = [
  'Entity', 'Banking', 'Insurance', 'Identifiers', 'HIPAA', 'General',
];

// Sort: in-progress first, not-started next, done last; then by due date within group
export const CHK_SORT_ORDER: Record<string, number> = {
  progress: 0, notstarted: 1, done: 2,
};

// ─── Finances ────────────────────────────────────────────────────────────────

export type TxType = 'income' | 'expense';

export interface LedgerEntry {
  id: string;
  date: string;       // ISO date, e.g. "2026-06-15"
  type: TxType;
  category: string;
  source: string;     // income source or vendor name
  amount: number;
  note: string;
}

export interface TaxPayment {
  id: string;
  label: string;      // e.g. "Q1 2026"
  due: string;        // ISO date
  paid: boolean;
  paidAmount: number;
}

export interface FinancesState {
  currentMonth: string;             // display label, e.g. "June 2026"
  history: { m: string; rev: number; exp: number }[];  // Jan–May computed
  ledger: LedgerEntry[];
  taxRate: number;                  // 0.22 | 0.27 | 0.30
  taxPayments: TaxPayment[];
}

export const INCOME_CATEGORIES = ['Platform payout', 'Consulting', 'Clinical', 'Other income'] as const;
export const EXPENSE_CATEGORIES = ['Insurance', 'Licensing', 'Services', 'Software', 'Education', 'Other'] as const;
export const TAX_RATE_OPTS = [0.22, 0.27, 0.30] as const;

// ─── Engagements ─────────────────────────────────────────────────────────────

export type EngStatus = 'active' | 'prospect' | 'hold' | 'ended';
export type EngModel  = 'Async visits' | 'Scheduled video' | 'On-demand' | 'Panel/retainer' | 'Direct cash' | 'Other';

export interface EngagementRecord {
  id: string;
  name: string;
  model: EngModel;
  volume: string;
  rate: string;
  status: EngStatus;
  startDate: string;
  contact: string;
  portalUrl: string;
  payTerms: string;
  requirements: Requirement[];
  documents: LicenseDoc[];
  notes: string;
}

export const ENG_MODELS: EngModel[] = [
  'Async visits', 'Scheduled video', 'On-demand', 'Panel/retainer', 'Direct cash', 'Other',
];

export const ENG_STATUS_OPTS: [string, string, string][] = [
  ['active',   'Active',   'ok'],
  ['prospect', 'Prospect', 'info'],
  ['hold',     'On hold',  'warn'],
  ['ended',    'Ended',    'idle'],
];

export const ENG_SORT_ORDER: Record<string, number> = {
  active: 0, prospect: 1, hold: 2, ended: 3,
};

// ─── Credentialing ───────────────────────────────────────────────────────────

export type PayerType = 'Commercial' | 'Government' | 'Platform' | 'Clearinghouse' | 'Profile' | 'Other';
export type PayerStatus = 'notstarted' | 'submitted' | 'review' | 'approved';

export interface PayerRecord {
  id: string;
  name: string;
  type: PayerType;
  status: PayerStatus;
  date: string;           // last updated (ISO)
  effectiveDate: string;
  revalidation: string;   // revalidation due (ISO)
  providerId: string;
  rep: string;
  portalUrl: string;
  requirements: Requirement[];
  documents: LicenseDoc[];
  notes: string;
}

export const PAYER_TYPES: PayerType[] = ['Commercial', 'Government', 'Platform', 'Clearinghouse', 'Profile', 'Other'];

// Status options — display order matches the filter cards
export const PAYER_STATUS_OPTS: [string, string, string][] = [
  ['notstarted', 'Not started', 'idle'],
  ['submitted',  'Submitted',   'warn'],
  ['review',     'In review',   'info'],
  ['approved',   'Approved',    'ok'],
];

// Sort order for the enrollments table: in-review first, approved last
export const PAYER_SORT_ORDER: Record<string, number> = {
  review: 0, submitted: 1, notstarted: 2, approved: 3,
};
