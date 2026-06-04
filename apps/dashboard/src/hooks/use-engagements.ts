import { useQuery } from '@tanstack/react-query';
import { clientJson } from '@/lib/client-fetch';
import { MOCK_ENGAGEMENT_RECORDS } from '@/lib/mock-seeds';
import type { EngagementRecord } from '@/lib/types';

export const ENGAGEMENTS_KEY = ['engagements'] as const;

const USE_MOCK = process.env['NEXT_PUBLIC_USE_MOCK'] === 'true';

export function useEngagements() {
  return useQuery<EngagementRecord[]>({
    queryKey: ENGAGEMENTS_KEY,
    queryFn: USE_MOCK
      ? () => Promise.resolve(MOCK_ENGAGEMENT_RECORDS)
      : () => clientJson<EngagementRecord[]>('/engagements'),
  });
}
