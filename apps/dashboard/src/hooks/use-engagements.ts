import { useQuery } from '@tanstack/react-query';
import { clientJson } from '@/lib/client-fetch';
import type { EngagementRecord } from '@/lib/types';

export const ENGAGEMENTS_KEY = ['engagements'] as const;

export function useEngagements() {
  return useQuery<EngagementRecord[]>({
    queryKey: ENGAGEMENTS_KEY,
    queryFn: () => clientJson<EngagementRecord[]>('/engagements'),
  });
}
