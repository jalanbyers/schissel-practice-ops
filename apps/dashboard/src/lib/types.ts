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

// Full record shape used in the Licensing workspace.
// Mirrors the Drizzle `licenses` schema; the mock seed fills most fields empty.
export interface LicenseRecord {
  code: string;
  name: string;
  status: StateStatus;
  imlc: boolean;
  home: boolean;
  // dates
  date: string | null;   // submitted note or display date for in-progress
  expires: string;       // ISO date for renewal countdown
  issued: string;
  // facts
  licenseNo: string;
  cycle: RenewalCycle;
  fee: string;
  board: string;
  boardUrl: string;
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
