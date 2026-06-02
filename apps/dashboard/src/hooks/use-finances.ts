import { useQuery } from '@tanstack/react-query';
import { clientJson } from '@/lib/client-fetch';
import type { FinancesState } from '@/lib/types';

export const FINANCES_KEY = ['finances'] as const;

export function useFinances() {
  return useQuery<FinancesState>({
    queryKey: FINANCES_KEY,
    queryFn: () => clientJson<FinancesState>('/finances'),
  });
}
