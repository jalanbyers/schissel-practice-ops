import { useQuery } from '@tanstack/react-query';
import { clientJson } from '@/lib/client-fetch';
import { MOCK_LICENSES } from '@/lib/seed-licenses';
import type { LicenseRecord } from '@/lib/types';

export const LICENSES_KEY = ['licenses'] as const;

const USE_MOCK = process.env['NEXT_PUBLIC_USE_MOCK'] === 'true';

export function useLicenses() {
  return useQuery<LicenseRecord[]>({
    queryKey: LICENSES_KEY,
    queryFn: USE_MOCK
      ? () => Promise.resolve(MOCK_LICENSES)
      : () => clientJson<LicenseRecord[]>('/licenses'),
  });
}
