// Maps raw MockXxx shapes from mock-data.ts to full API return types.
// Imported by hooks when NEXT_PUBLIC_USE_MOCK=true.
import { MOCK_CHECKLIST, MOCK_ENGAGEMENTS, MOCK_FINANCES, MOCK_PAYERS } from './mock-data';
import type { ChecklistTask, EngagementRecord, FinancesState, PayerRecord } from './types';

export const MOCK_CHECKLIST_TASKS: ChecklistTask[] = MOCK_CHECKLIST.map((c, i) => ({
  id: `mock-chk-${i}`,
  task: c.task,
  group: c.group as ChecklistTask['group'],
  status: c.status,
  date: c.date,
  owner: '',
  requirements: [],
  documents: [],
  notes: '',
}));

export const MOCK_ENGAGEMENT_RECORDS: EngagementRecord[] = MOCK_ENGAGEMENTS.map((e, i) => ({
  id: `mock-eng-${i}`,
  name: e.name,
  model: e.model as EngagementRecord['model'],
  volume: e.volume,
  rate: e.rate,
  status: e.status,
  startDate: '',
  contact: '',
  portalUrl: '',
  payTerms: '',
  requirements: [],
  documents: [],
  notes: '',
}));

export const MOCK_FINANCES_STATE: FinancesState = {
  currentMonth: 'June 2026',
  history: MOCK_FINANCES.months.map(({ m, rev, exp }) => ({ m, rev, exp })),
  ledger: [],
  taxRate: 0.27,
  taxPayments: [],
};

export const MOCK_PAYER_RECORDS: PayerRecord[] = MOCK_PAYERS.map((p, i) => ({
  id: `mock-payer-${i}`,
  name: p.name,
  type: p.type as PayerRecord['type'],
  status: p.status,
  date: p.date ?? '',
  effectiveDate: '',
  revalidation: '',
  providerId: '',
  rep: '',
  portalUrl: '',
  requirements: [],
  documents: [],
  notes: '',
}));
