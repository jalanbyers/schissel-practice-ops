import { MOCK_PAYERS } from './mock-data';
import { uid } from './date-helpers';
import type { PayerRecord, PayerType, PayerStatus } from './types';

export function seedPayers(): PayerRecord[] {
  return MOCK_PAYERS.map((p) => ({
    id: uid(),
    name: p.name,
    type: p.type as PayerType,
    status: p.status as PayerStatus,
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
}
