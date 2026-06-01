import { MOCK_CHECKLIST } from './mock-data';
import { uid } from './date-helpers';
import type { ChecklistTask, CheckStatus, ChecklistGroup } from './types';

export function seedChecklist(): ChecklistTask[] {
  return MOCK_CHECKLIST.map((c) => ({
    id: uid(),
    task: c.task,
    group: c.group as ChecklistGroup,
    status: c.status as CheckStatus,
    date: c.date,
    owner: '',
    requirements: [],
    documents: [],
    notes: '',
  }));
}
