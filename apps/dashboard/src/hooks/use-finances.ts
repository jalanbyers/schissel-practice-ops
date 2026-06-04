import { useQuery } from '@tanstack/react-query';
import { clientJson } from '@/lib/client-fetch';
import { MOCK_FINANCES_STATE } from '@/lib/mock-seeds';
import type { FinancesState } from '@/lib/types';

export const FINANCES_KEY = ['finances'] as const;

const USE_MOCK = process.env['NEXT_PUBLIC_USE_MOCK'] === 'true';

export function useFinances() {
  return useQuery<FinancesState>({
    queryKey: FINANCES_KEY,
    queryFn: USE_MOCK
      ? () => Promise.resolve(MOCK_FINANCES_STATE)
      : () => clientJson<FinancesState>('/finances'),
  });
}
