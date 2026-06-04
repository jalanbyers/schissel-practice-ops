import { useQuery } from '@tanstack/react-query';
import { clientJson } from '@/lib/client-fetch';
import { MOCK_CHECKLIST_TASKS } from '@/lib/mock-seeds';
import type { ChecklistTask } from '@/lib/types';

export const CHECKLIST_KEY = ['checklist'] as const;

const USE_MOCK = process.env['NEXT_PUBLIC_USE_MOCK'] === 'true';

export function useChecklist() {
  return useQuery<ChecklistTask[]>({
    queryKey: CHECKLIST_KEY,
    queryFn: USE_MOCK
      ? () => Promise.resolve(MOCK_CHECKLIST_TASKS)
      : () => clientJson<ChecklistTask[]>('/compliance'),
  });
}
