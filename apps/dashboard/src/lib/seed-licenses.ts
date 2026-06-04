// Convert MOCK_STATES into full LicenseRecord objects with drawer-ready fields.
// Per-state patches override the generic defaults for states with known detail.
import { MOCK_STATES } from './mock-data';
import type { LicenseRecord, Requirement } from './types';

function req(id: string, label: string): Requirement {
  return { id, label, done: false };
}

const PATCHES: Partial<Record<string, Partial<LicenseRecord>>> = {
  FL: {
    status: 'none',
    imlc: true,
    date: null,
    expires: '',
    fee: '$355',
    timeline: '10–12 weeks',
    cmeHours: 40,
    board: 'Florida Board of Medicine',
    boardUrl: 'https://flboardofmedicine.gov',
    telehealthNotes:
      'No separate telehealth registration required for FL-licensed physicians. ' +
      'Schedule II controlled substances cannot be prescribed via telehealth except for ' +
      'psychiatric treatment, inpatient hospital care, hospice, or nursing home patients. ' +
      'Malpractice insurance must cover telehealth services.',
    notes:
      'Renewal window opens 90 days before expiration. Late renewal fee jumps to $729. ' +
      'CME must be logged in CE Broker before submission. Verify expiration group at ' +
      'flhealthsource.gov — standard FL MD cycle is January 31 biennial.',
    requirements: [
      req('fl-req-0',  '40 hours AMA Category 1 CME logged in CE Broker'),
      req('fl-req-1',  '2-hour Medical Errors prevention course (board-approved)'),
      req('fl-req-2',  '2-hour Controlled Substances prescribing course (DEA-registered physicians only)'),
      req('fl-req-3',  '2-hour Domestic Violence course (every third renewal cycle)'),
      req('fl-req-4',  'Online renewal application at flhealthsource.gov'),
      req('fl-req-5',  'Practitioner Profile confirmed/updated'),
      req('fl-req-6',  'Workforce Survey completed'),
      req('fl-req-7',  'Financial Responsibility Form submitted'),
      req('fl-req-8',  'Background screening / fingerprint retention documentation'),
      req('fl-req-9',  'NICA assessment fee paid'),
      req('fl-req-10', 'Practice attestation (2 of past 4 years active)'),
      req('fl-req-11', 'Renewal fee of $355.00 paid'),
    ],
  },
};

function buildLicenses(): LicenseRecord[] {
  return MOCK_STATES.map((s) => {
    const base: LicenseRecord = {
      code: s.code,
      name: s.name,
      status: s.status,
      imlc: s.imlc,
      home: s.home ?? false,
      date: s.date,
      expires: s.date && s.date.includes('-') ? s.date : '',
      issued: '',
      licenseNo: '',
      cycle: 'Biennial',
      fee: '',
      applicationFee: '',
      timeline: '',
      cmeHours: null,
      telehealthNotes: '',
      board: '',
      boardUrl: '',
      requirements: [],
      documents: [],
      notes: '',
    };
    return { ...base, ...PATCHES[s.code] };
  });
}

export function seedLicenses(): LicenseRecord[] { return buildLicenses(); }
export const MOCK_LICENSES: LicenseRecord[] = buildLicenses();
