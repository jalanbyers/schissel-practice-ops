import { useQuery } from '@tanstack/react-query';
import { mockTaskStore } from '@/lib/mock-store';
import type { ChecklistTask } from '@/lib/types';

export const CHECKLIST_KEY = ['checklist'] as const;

export function useChecklist() {
  return useQuery<ChecklistTask[]>({
    queryKey: CHECKLIST_KEY,
    queryFn: () => Promise.resolve([...mockTaskStore.getAll()]),
  });
}
