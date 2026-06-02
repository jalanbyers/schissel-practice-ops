import { useQuery } from '@tanstack/react-query';
import { clientJson } from '@/lib/client-fetch';
import type { ChecklistTask } from '@/lib/types';

export const CHECKLIST_KEY = ['checklist'] as const;

export function useChecklist() {
  return useQuery<ChecklistTask[]>({
    queryKey: CHECKLIST_KEY,
    queryFn: () => clientJson<ChecklistTask[]>('/compliance'),
  });
}
