import { useQuery } from '@tanstack/react-query';
import { clientJson } from '@/lib/client-fetch';
import { MOCK_PAYER_RECORDS } from '@/lib/mock-seeds';
import type { PayerRecord } from '@/lib/types';

export const PAYERS_KEY = ['payers'] as const;

const USE_MOCK = process.env['NEXT_PUBLIC_USE_MOCK'] === 'true';

export function usePayers() {
  return useQuery<PayerRecord[]>({
    queryKey: PAYERS_KEY,
    queryFn: USE_MOCK
      ? () => Promise.resolve(MOCK_PAYER_RECORDS)
      : () => clientJson<PayerRecord[]>('/payers'),
  });
}
