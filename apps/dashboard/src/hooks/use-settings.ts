import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientJson, clientFetch } from '@/lib/client-fetch';

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

export function useSettings() {
  return useQuery<ApiSettings>({
    queryKey: SETTINGS_KEY,
    queryFn: () => clientJson<ApiSettings>('/settings'),
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
