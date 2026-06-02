import { useQuery } from '@tanstack/react-query';
import { clientJson } from '@/lib/client-fetch';
import type { PayerRecord } from '@/lib/types';

export const PAYERS_KEY = ['payers'] as const;

export function usePayers() {
  return useQuery<PayerRecord[]>({
    queryKey: PAYERS_KEY,
    queryFn: () => clientJson<PayerRecord[]>('/payers'),
  });
}
