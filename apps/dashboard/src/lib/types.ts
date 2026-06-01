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
