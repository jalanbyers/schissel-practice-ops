// Convert MOCK_STATES into full LicenseRecord objects with drawer-ready fields.
import { MOCK_STATES } from './mock-data';
import type { LicenseRecord } from './types';

export function seedLicenses(): LicenseRecord[] {
  return MOCK_STATES.map((s) => ({
    code: s.code,
    name: s.name,
    status: s.status,
    imlc: s.imlc,
    home: s.home ?? false,
    date: s.date,
    // If date is an ISO date string, use it as expires; otherwise blank
    expires: s.date && s.date.includes('-') ? s.date : '',
    issued: '',
    licenseNo: '',
    cycle: 'Biennial' as const,
    fee: '',
    board: '',
    boardUrl: '',
    requirements: [],
    documents: [],
    notes: '',
  }));
}
