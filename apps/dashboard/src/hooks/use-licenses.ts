import { useQuery } from '@tanstack/react-query';
import { clientJson } from '@/lib/client-fetch';
import type { LicenseRecord } from '@/lib/types';

export const LICENSES_KEY = ['licenses'] as const;

export function useLicenses() {
  return useQuery<LicenseRecord[]>({
    queryKey: LICENSES_KEY,
    queryFn: () => clientJson<LicenseRecord[]>('/licenses'),
  });
}
