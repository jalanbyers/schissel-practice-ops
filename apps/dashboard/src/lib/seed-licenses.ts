// Convert MOCK_STATES into full LicenseRecord objects with drawer-ready fields.
// Per-state patches override the generic defaults for states with known detail.
import { MOCK_STATES } from './mock-data';
import type { LicenseRecord, Requirement } from './types';

function req(id: string, label: string): Requirement {
  return { id, label, done: false };
}

const PATCHES: Partial<Record<string, Partial<LicenseRecord>>> = {
  NH: {
    cycle: 'Biennial',
    fee: '$300',
    applicationFee: '$300',
    timeline: '4–6 weeks',
    cmeHours: 100,
    board: 'New Hampshire Board of Medicine',
    boardUrl: 'https://www.oplc.nh.gov/medicine',
    lastChecked: '2026-07-14',
    telehealthNotes:
      'NH participates in IMLC — IMLC compact privilege is valid for telehealth. ' +
      'No separate telehealth registration required for NH-licensed physicians. ' +
      'Prescribing controlled substances via telehealth follows DEA telemedicine rules; ' +
      'an in-person visit is required before issuing a Schedule II prescription unless a ' +
      'DEA telemedicine exception applies.',
    notes:
      'Home state license — keep this current above all others. ' +
      'Biennial renewal due April 30 of odd years. ' +
      'CME must be completed before the renewal date; 100 hours per cycle with at least ' +
      '40 hours in AMA Category 1. Late fee applies after expiration.',
    requirements: [
      req('nh-req-0', '100 hours CME per biennial cycle (≥40 Category 1)'),
      req('nh-req-1', 'Online renewal at oplc.nh.gov'),
      req('nh-req-2', 'Continuing Medical Education attestation'),
      req('nh-req-3', 'Malpractice history disclosure'),
      req('nh-req-4', 'DEA registration current (if prescribing controlled substances)'),
      req('nh-req-5', 'Renewal fee of $300.00 paid'),
    ],
  },

  MA: {
    cycle: 'Biennial',
    fee: '$200',
    applicationFee: '$200',
    timeline: '6–8 weeks',
    cmeHours: 50,
    board: 'Massachusetts Board of Registration in Medicine',
    boardUrl: 'https://www.mass.gov/orgs/board-of-registration-in-medicine',
    lastChecked: '2026-07-09',
    telehealthNotes:
      'MA does not participate in IMLC. A full MA license is required to see MA patients. ' +
      'No separate telehealth registration. Prescribing via telehealth is permitted; ' +
      'controlled substance prescribing follows standard DEA rules plus MA DPH requirements. ' +
      'Telemedicine prescribing of Schedule II–III requires a prior in-person relationship ' +
      'unless the patient is in a hospital or other authorized setting.',
    notes:
      'Renewal cycle is biennial, expiring on the license anniversary month. ' +
      '50 CME hours required per cycle; at least 25 must be risk-management related if ' +
      'the licensee had a malpractice claim in the period. ' +
      'Controlled substance prescriptions must be filed in MA PMP (PrescriptionMonitor).',
    requirements: [
      req('ma-req-0', '50 hours CME per biennial cycle'),
      req('ma-req-1', 'Risk-management CME (25 hrs if malpractice claim in cycle)'),
      req('ma-req-2', 'Opioid prescribing education (3 hrs, every 2 years)'),
      req('ma-req-3', 'Online renewal via physician.state.ma.us'),
      req('ma-req-4', 'Malpractice disclosure form submitted'),
      req('ma-req-5', 'Renewal fee of $200.00 paid'),
    ],
  },

  CA: {
    cycle: 'Biennial',
    fee: '$880',
    applicationFee: '$1,014',
    timeline: '10–16 weeks',
    cmeHours: 50,
    board: 'Medical Board of California',
    boardUrl: 'https://www.mbc.ca.gov',
    lastChecked: '2026-07-15',
    telehealthNotes:
      'CA does not participate in IMLC. A full CA license is required. ' +
      'Telehealth is broadly permitted under CA law. ' +
      'Schedule II controlled substances may not be prescribed via telehealth for new ' +
      'patients without an appropriate prior examination or exception. ' +
      'Physicians must provide patients with their name, practice address, and specialty ' +
      'before or at the time of a telehealth encounter (AB 2123).',
    notes:
      'Biennial renewal on physician birth month. ' +
      'CME: 50 hours per cycle including mandatory topics: pain management/end-of-life (8 hrs, ' +
      'once), implicit bias (4 hrs first renewal, 2 hrs thereafter), suicide prevention (1 hr). ' +
      'Failure to renew on time triggers an additional $440 delinquency fee.',
    requirements: [
      req('ca-req-0', '50 hours CME per biennial cycle'),
      req('ca-req-1', '4-hour implicit bias training (2 hrs subsequent renewals)'),
      req('ca-req-2', '1-hour suicide prevention training'),
      req('ca-req-3', '8-hour pain management / end-of-life course (once per career)'),
      req('ca-req-4', 'Online renewal via breeze.ca.gov'),
      req('ca-req-5', 'Breeze profile updated (practice address, specialty)'),
      req('ca-req-6', 'Renewal fee of $880.00 paid'),
    ],
  },

  TX: {
    cycle: 'Biennial',
    fee: '$390',
    applicationFee: '$857',
    timeline: '8–12 weeks',
    cmeHours: 48,
    board: 'Texas Medical Board',
    boardUrl: 'https://www.tmb.state.tx.us',
    lastChecked: '2026-07-11',
    telehealthNotes:
      'TX does not participate in IMLC. A full TX license is required to treat TX patients. ' +
      'SB 1107 (2017) allows telehealth services without a prior in-person visit as long as ' +
      'the standard of care is met. Prescribing controlled substances via telehealth requires ' +
      'compliance with Texas Controlled Substances Act and DEA rules; Schedule II via ' +
      'telemedicine requires an in-person exam unless a DEA exception applies.',
    notes:
      'Application submitted Apr 18 — currently under review. ' +
      'TX uses a criminal history check through the DPS. Board may request additional documents. ' +
      'Once issued, license renews biennially on the physician\'s birth month. ' +
      '48 CME hours per cycle including 2 hrs medical ethics and 2 hrs Texas prescribing law.',
    requirements: [
      req('tx-req-0', 'Online application via TMB portal'),
      req('tx-req-1', 'Medical school diploma / ECFMG certificate'),
      req('tx-req-2', 'USMLE / COMLEX transcript requested from FSMB'),
      req('tx-req-3', 'DPS criminal history fingerprint card submitted'),
      req('tx-req-4', 'Malpractice history verification (all states practiced)'),
      req('tx-req-5', 'Postgraduate training verification'),
      req('tx-req-6', 'Board certification or continuous active practice attestation'),
      req('tx-req-7', 'Application fee of $857.00 paid'),
    ],
  },

  FL: {
    cycle: 'Biennial',
    fee: '$355',
    applicationFee: '$505',
    timeline: '10–12 weeks',
    cmeHours: 40,
    board: 'Florida Board of Medicine',
    boardUrl: 'https://flboardofmedicine.gov',
    lastChecked: '2026-07-16',
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

  NY: {
    cycle: 'Triennial',
    fee: '$315',
    applicationFee: '$735',
    timeline: '12–16 weeks',
    cmeHours: 150,
    board: 'New York State Board for Medicine',
    boardUrl: 'https://www.op.nysed.gov/professions/medicine',
    lastChecked: '2026-07-12',
    telehealthNotes:
      'NY does not participate in IMLC. A full NY license is required. ' +
      'Telehealth is authorized under Education Law §6524(17). ' +
      'No separate telehealth registration required. ' +
      'Controlled substance prescribing via telehealth requires DEA compliance; ' +
      'Schedule II prescribing may not occur via audio-only visits.',
    notes:
      'Application submitted May 2 — processing times at NYSED are typically 12–16 weeks. ' +
      'NY uses a triennial (3-year) cycle. ' +
      '150 CME hours per cycle required; all hours must be approved by NYSED or equivalent. ' +
      'NY also requires physicians to register with the ISTOP (I-STOP/PMP) before prescribing ' +
      'controlled substances.',
    requirements: [
      req('ny-req-0', 'Online application via NY eAccessNY portal'),
      req('ny-req-1', 'ECFMG certification (if IMG)'),
      req('ny-req-2', 'USMLE score transcript via FSMB'),
      req('ny-req-3', 'Postgraduate training affidavit'),
      req('ny-req-4', 'Moral character questionnaire'),
      req('ny-req-5', 'Malpractice history for all prior states'),
      req('ny-req-6', 'NY State criminal background check authorization'),
      req('ny-req-7', 'Application fee of $735.00 paid'),
    ],
  },

  IL: {
    cycle: 'Biennial',
    fee: '$180',
    applicationFee: '$500',
    timeline: '6–10 weeks',
    cmeHours: 150,
    board: 'Illinois Department of Financial & Professional Regulation — Division of Professional Regulation',
    boardUrl: 'https://idfpr.illinois.gov/profs/medicaldr.asp',
    lastChecked: '2026-07-08',
    telehealthNotes:
      'IL participates in IMLC — compact privilege is valid for telehealth. ' +
      'No separate telehealth registration required for IL-licensed physicians. ' +
      'The Illinois Telehealth Act (P.A. 102-0744) establishes parity with in-person services. ' +
      'Prescribing controlled substances via telehealth follows DEA rules; in-person exam ' +
      'generally required before issuing a Schedule II prescription to a new patient.',
    notes:
      'Biennial renewal due January 31 of odd years. ' +
      '150 CME hours per 2-year cycle; IDFPR accepts AMA PRA Category 1 credits. ' +
      'Mandatory topics: sexual harassment prevention (1 hr), opioid prescribing and pain ' +
      'management (3 hrs). Continuing education must be completed before renewal.',
    requirements: [
      req('il-req-0', '150 hours CME per biennial cycle (AMA Category 1 accepted)'),
      req('il-req-1', '1-hour sexual harassment prevention training'),
      req('il-req-2', '3-hour opioid prescribing / pain management CME'),
      req('il-req-3', 'Online renewal via IDFPR Connect portal'),
      req('il-req-4', 'Illinois PMP (PMPAWARE) account active'),
      req('il-req-5', 'Renewal fee of $180.00 paid'),
    ],
  },

  GA: {
    cycle: 'Biennial',
    fee: '$200',
    applicationFee: '$275',
    timeline: '6–10 weeks',
    cmeHours: 40,
    board: 'Georgia Composite Medical Board',
    boardUrl: 'https://gcmb.georgia.gov',
    lastChecked: '2026-07-13',
    telehealthNotes:
      'GA participates in IMLC — compact privilege is valid for telehealth. ' +
      'No separate telehealth registration required. ' +
      'The GA Telehealth Act permits telehealth services statewide; parity with in-person ' +
      'services is required for insurance reimbursement. ' +
      'Prescribing via telehealth is permitted; Schedule II is subject to standard DEA rules.',
    notes:
      'Expiring Aug 10, 2026 — renewal window is open now. ' +
      'Biennial cycle, renewal due August 31 of even years. ' +
      '40 CME hours per cycle required; GCMB accepts AMA Category 1. ' +
      'Mandatory: 2-hour medical ethics CME per cycle.',
    requirements: [
      req('ga-req-0', '40 hours CME per biennial cycle'),
      req('ga-req-1', '2-hour medical ethics CME'),
      req('ga-req-2', 'Online renewal via gcmb.georgia.gov'),
      req('ga-req-3', 'Georgia PMP (PDMP) access account active'),
      req('ga-req-4', 'Malpractice coverage attestation'),
      req('ga-req-5', 'Renewal fee of $200.00 paid'),
    ],
  },

  NC: {
    cycle: 'Annual',
    fee: '$175',
    applicationFee: '$400',
    timeline: '8–12 weeks',
    cmeHours: 60,
    board: 'North Carolina Medical Board',
    boardUrl: 'https://www.ncmedboard.org',
    lastChecked: '2026-07-10',
    telehealthNotes:
      'NC does not currently participate in IMLC. A full NC license is required. ' +
      'Telehealth is permitted under G.S. 90-18.5; no separate telehealth registration. ' +
      'NC requires that physicians practicing telehealth meet the same standard of care as ' +
      'in-person visits. Prescribing via telehealth is permitted; controlled substances ' +
      'follow DEA rules and NC PMP reporting requirements.',
    notes:
      'Not yet licensed in NC — this state is a target for expansion. ' +
      'Annual license cycle (unlike most states). ' +
      '60 CME hours required per annual cycle (NC\'s high CME requirement reflects the annual cycle). ' +
      'NCMB can issue licenses via traditional paper application or through FCVS.',
    requirements: [
      req('nc-req-0', 'Online application via NCMB portal'),
      req('nc-req-1', 'Medical school and residency verification'),
      req('nc-req-2', 'USMLE / COMLEX scores from FSMB'),
      req('nc-req-3', 'NPDB self-query (within 90 days)'),
      req('nc-req-4', 'Malpractice history form (all states)'),
      req('nc-req-5', 'Criminal background check'),
      req('nc-req-6', 'Application fee of $400.00 paid'),
    ],
  },

  PA: {
    cycle: 'Biennial',
    fee: '$400',
    applicationFee: '$355',
    timeline: '10–14 weeks',
    cmeHours: 100,
    board: 'Pennsylvania State Board of Medicine',
    boardUrl: 'https://www.dos.pa.gov/ProfessionalLicensing/BoardsCommissions/Medicine',
    lastChecked: '2026-07-07',
    telehealthNotes:
      'PA participates in IMLC — compact privilege is valid for telehealth. ' +
      'No separate telehealth registration required for PA-licensed physicians. ' +
      'Act 2020-01 (COVID-era telehealth law) was made permanent by Act 2022-132, ' +
      'permitting telehealth across modalities. Controlled substance prescribing via ' +
      'telehealth requires DEA compliance; PA PMP (PDMP) reporting mandatory.',
    notes:
      'Application submitted May 19 — PA Board processing time is currently 10–14 weeks. ' +
      'Biennial renewal due the last day of the physician\'s birth month every 2 years. ' +
      '100 CME hours per cycle required; must include 2 hrs patient safety and ' +
      '2 hrs on topics designated by the board (opioid prescribing, child abuse recognition, ' +
      'or elder abuse depending on specialty).',
    requirements: [
      req('pa-req-0', 'Online application via PA PALS portal'),
      req('pa-req-1', 'Medical education verification (ECFMG if IMG)'),
      req('pa-req-2', 'USMLE / COMLEX transcript from FSMB'),
      req('pa-req-3', 'Postgraduate training verification'),
      req('pa-req-4', 'Malpractice history (all states, past 10 years)'),
      req('pa-req-5', 'PA State Police background check'),
      req('pa-req-6', 'Application fee of $355.00 paid'),
    ],
  },

  WA: {
    cycle: 'Annual',
    fee: '$648',
    applicationFee: '$600',
    timeline: '8–12 weeks',
    cmeHours: 200,
    board: 'Washington Medical Commission',
    boardUrl: 'https://wmc.wa.gov',
    lastChecked: '2026-07-06',
    telehealthNotes:
      'WA participates in IMLC — compact privilege is valid for telehealth. ' +
      'No separate telehealth registration required. ' +
      'WA broadly supports telehealth; RCW 48.43.735 requires insurers to cover telehealth ' +
      'services at parity. Controlled substances may be prescribed via telehealth under ' +
      'DEA rules; Schedule II requires compliance with current DEA telemedicine regulations.',
    notes:
      'Annual license cycle with a high CME requirement (200 hours per 4-year credential ' +
      'period — effectively 50/yr). Renewal due each year on the physician\'s birth month. ' +
      'WA uses the WMC online portal (secureaccess.wa.gov). ' +
      'Mandatory CME topics: suicide assessment/treatment (6 hrs per cycle), ' +
      'opioid prescribing (consistent with CDC guidelines).',
    requirements: [
      req('wa-req-0', '200 hours CME per 4-year credential period (≥50 Category 1 per year)'),
      req('wa-req-1', '6-hour suicide assessment / treatment CME per cycle'),
      req('wa-req-2', 'Opioid prescribing CME (per CDC guidelines)'),
      req('wa-req-3', 'Online renewal via secureaccess.wa.gov'),
      req('wa-req-4', 'WA PDMP (PMP AWARxE) account active'),
      req('wa-req-5', 'Annual renewal fee of $648.00 paid'),
    ],
  },

  VA: {
    cycle: 'Biennial',
    fee: '$302',
    applicationFee: '$302',
    timeline: '6–10 weeks',
    cmeHours: 60,
    board: 'Virginia Board of Medicine',
    boardUrl: 'https://www.dhp.virginia.gov/medicine',
    lastChecked: '2026-07-09',
    telehealthNotes:
      'VA participates in IMLC — compact privilege is valid for telehealth. ' +
      'No separate telehealth registration required for VA-licensed physicians. ' +
      'VA Code §54.1-3303.1 authorizes telehealth without a prior in-person relationship. ' +
      'Prescribing controlled substances via telehealth follows DEA rules; ' +
      'VA PDMP (Prescription Monitoring Program) check required before prescribing Schedule II–V.',
    notes:
      'Biennial renewal due March 31 of odd years. ' +
      '60 CME hours per 2-year cycle required; at least 30 must be AMA Category 1. ' +
      'Mandatory: 2 hrs opioid and pain management CME per cycle. ' +
      'VA Board accepts CME completed through accredited organizations (AMA, AOA, AAFP).',
    requirements: [
      req('va-req-0', '60 hours CME per biennial cycle (≥30 Category 1)'),
      req('va-req-1', '2-hour opioid / pain management CME'),
      req('va-req-2', 'Online renewal via Virginia eLicense portal'),
      req('va-req-3', 'VA PDMP enrollment verification'),
      req('va-req-4', 'Malpractice coverage attestation'),
      req('va-req-5', 'Renewal fee of $302.00 paid'),
    ],
  },

  OH: {
    cycle: 'Biennial',
    fee: '$270',
    applicationFee: '$650',
    timeline: '8–12 weeks',
    cmeHours: 100,
    board: 'State Medical Board of Ohio',
    boardUrl: 'https://med.ohio.gov',
    lastChecked: '2026-07-15',
    // NOTE: this record is deliberately self-conflicting. It is the fixture for
    // eval case R-AMBIG-01 (docs/DESIGN_SPEC.md §9.4). Sentence 1 says a compact
    // privilege is sufficient without an Ohio license; sentence 2 says a full
    // unrestricted Ohio license is required before the first encounter. Both
    // cannot be acted on, and "within a reasonable period" has no actionable
    // threshold. The `notes` field below is intentionally free of any ambiguity
    // flag — the agent must catch this from the language alone.
    telehealthNotes:
      'OH participates in IMLC — physicians holding an active compact privilege may ' +
      'deliver telehealth services to patients located in Ohio without a separate ' +
      'Ohio license. Physicians providing telehealth services to patients located in ' +
      'Ohio must hold a full unrestricted Ohio medical license issued by the State ' +
      'Medical Board of Ohio prior to the first patient encounter. ' +
      'HB 122 (2021) created permanent telehealth authorization. ' +
      'Telemedicine registration should be completed within a reasonable period ' +
      'before care begins. ' +
      'Schedule II controlled substances require an in-person exam unless a DEA or ' +
      'state exception applies; OH PDMP check required before dispensing/prescribing.',
    notes:
      'Not yet licensed in OH — target state for IMLC expansion. ' +
      'Biennial renewal due each physician\'s birth month. ' +
      '100 CME hours per cycle required; at least 40 must be AMA Category 1. ' +
      'Mandatory: 2 hrs prescribing opioids and other controlled substances per cycle. ' +
      'SMBO also requires domestic violence training (2 hrs) every 6 years.',
    requirements: [
      req('oh-req-0', 'Online application via SMBO eLicense portal'),
      req('oh-req-1', 'FSMB Primary Source Verification or FCVS credentials'),
      req('oh-req-2', 'USMLE / COMLEX official score transcript'),
      req('oh-req-3', 'Postgraduate training verification'),
      req('oh-req-4', 'Malpractice / discipline history (all states)'),
      req('oh-req-5', 'Ohio BCI criminal background check'),
      req('oh-req-6', 'Application fee of $650.00 paid'),
    ],
  },

  AZ: {
    cycle: 'Biennial',
    fee: '$500',
    applicationFee: '$500',
    timeline: '6–10 weeks',
    cmeHours: 40,
    board: 'Arizona Medical Board',
    boardUrl: 'https://azmd.gov',
    lastChecked: '2026-03-15',
    telehealthNotes:
      'AZ participates in IMLC — compact privilege is valid for telehealth. ' +
      'No separate telehealth registration required. ' +
      'ARS §36-3601 authorizes telehealth across the state; parity coverage required ' +
      'for most insurers. Prescribing via telehealth is permitted; ' +
      'Schedule II via telemedicine requires a valid DEA telemedicine exception or ' +
      'prior in-person relationship.',
    notes:
      'Biennial renewal due February 28 of odd years. ' +
      'Only 40 CME hours per 2-year cycle — one of the lower requirements nationally. ' +
      'AZ Board accepts AMA Category 1 and 2. No mandatory CME topics (as of 2026). ' +
      'Fingerprint clearance card (from AZ DPS) required at initial application; ' +
      'not required at renewal.',
    requirements: [
      req('az-req-0', '40 hours CME per biennial cycle'),
      req('az-req-1', 'Online renewal via AZMD portal (azmd.gov)'),
      req('az-req-2', 'AZ CSPMP (PDMP) account current'),
      req('az-req-3', 'Malpractice coverage attestation'),
      req('az-req-4', 'Renewal fee of $500.00 paid'),
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
      lastChecked: '',
      requirements: [],
      documents: [],
      notes: '',
    };
    return { ...base, ...PATCHES[s.code] };
  });
}

export function seedLicenses(): LicenseRecord[] { return buildLicenses(); }
export const MOCK_LICENSES: LicenseRecord[] = buildLicenses();
