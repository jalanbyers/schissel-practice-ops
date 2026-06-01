import { MOCK_ENGAGEMENTS } from './mock-data';
import { uid } from './date-helpers';
import type { EngagementRecord, EngStatus, EngModel } from './types';

export function seedEngagements(): EngagementRecord[] {
  return MOCK_ENGAGEMENTS.map((e) => ({
    id: uid(),
    name: e.name,
    model: e.model as EngModel,
    volume: e.volume,
    rate: e.rate,
    status: e.status as EngStatus,
    startDate: '',
    contact: '',
    portalUrl: '',
    payTerms: '',
    requirements: [],
    documents: [],
    notes: '',
  }));
}
