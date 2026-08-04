import { useQuery } from '@tanstack/react-query';
import { clientJson } from '@/lib/client-fetch';
import { MOCK_ENGAGEMENT_RECORDS } from '@/lib/mock-seeds';
import type { EngagementRecord } from '@/lib/types';

export const ENGAGEMENTS_KEY = ['engagements'] as const;

const USE_MOCK = process.env['NEXT_PUBLIC_USE_MOCK'] === 'true';

/**
 * Normalize an engagement row from the API into the shape the UI declares.
 *
 * `EngagementRecord` types every text field as `string`, but the underlying
 * columns are nullable, so the API legitimately returns `null` for anything
 * unset. `clientJson<EngagementRecord[]>` is a cast, not a runtime check, so
 * those nulls reached controlled inputs and React warned: "`value` prop on
 * `input` should not be null."
 *
 * Mock mode never hit this because the fixtures use empty strings — it only
 * appeared once the dashboard ran against the live API.
 *
 * Normalizing here rather than at each input fixes every field at once and
 * keeps the boundary honest: past this function the declared type is true.
 */
function normalize(row: EngagementRecord): EngagementRecord {
  return {
    ...row,
    name: row.name ?? '',
    volume: row.volume ?? '',
    rate: row.rate ?? '',
    startDate: row.startDate ?? '',
    contact: row.contact ?? '',
    portalUrl: row.portalUrl ?? '',
    payTerms: row.payTerms ?? '',
    notes: row.notes ?? '',
    requirements: row.requirements ?? [],
    documents: row.documents ?? [],
  };
}

export function useEngagements() {
  return useQuery<EngagementRecord[]>({
    queryKey: ENGAGEMENTS_KEY,
    queryFn: USE_MOCK
      ? () => Promise.resolve(MOCK_ENGAGEMENT_RECORDS)
      : async () => (await clientJson<EngagementRecord[]>('/engagements')).map(normalize),
  });
}
