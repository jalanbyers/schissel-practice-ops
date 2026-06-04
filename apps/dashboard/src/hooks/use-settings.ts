import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientJson, clientFetch } from '@/lib/client-fetch';
import { MOCK_SETTINGS } from '@/lib/mock-data';

export const SETTINGS_KEY = ['settings'] as const;

export interface ApiSettings {
  tenantId: string;
  name: string;
  entity: string;
  homeState: string;
  npi: string | null;
  ein: string | null;
  email: string | null;
  phone: string | null;
  timezone: string;
  taxRate: string;
  notifications: {
    licenseRenewals: boolean;
    recredentialing: boolean;
    complianceDue: boolean;
    weeklyDigest: boolean;
    leadDays: 14 | 30 | 60 | 90;
  };
}

const USE_MOCK = process.env['NEXT_PUBLIC_USE_MOCK'] === 'true';

const MOCK_API_SETTINGS: ApiSettings = {
  tenantId: 'mock',
  name: MOCK_SETTINGS.name,
  entity: MOCK_SETTINGS.entity,
  homeState: MOCK_SETTINGS.homeState,
  npi: null,
  ein: null,
  email: null,
  phone: null,
  timezone: 'America/New_York',
  taxRate: '0.27',
  notifications: {
    licenseRenewals: true,
    recredentialing: true,
    complianceDue: true,
    weeklyDigest: true,
    leadDays: 30,
  },
};

export function useSettings() {
  return useQuery<ApiSettings>({
    queryKey: SETTINGS_KEY,
    queryFn: USE_MOCK
      ? () => Promise.resolve(MOCK_API_SETTINGS)
      : () => clientJson<ApiSettings>('/settings'),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ApiSettings>) =>
      clientFetch('/settings', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
  });
}
