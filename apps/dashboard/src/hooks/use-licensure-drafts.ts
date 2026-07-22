import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientJson } from '@/lib/client-fetch';

/**
 * Mock mode matches the rest of the dashboard's hooks. Without it this feature
 * needs Postgres, the Fastify API and a running agent before anything renders,
 * which makes it undemoable — and the section silently shows nothing rather
 * than explaining why.
 */
const USE_MOCK = process.env['NEXT_PUBLIC_USE_MOCK'] === 'true';

/** One clarity condition verdict as the agent reported it. */
export interface ClarityCheck {
  condition_number: number;
  verdict: 'pass' | 'fail' | string;
  reasoning?: string;
  /** Present only on a condition-4 failure. */
  failure_mode?: string;
  /** Verbatim substring of the requirement text. The agent cannot escalate
   *  on language without one — see DESIGN_SPEC §5c. */
  quoted_span?: string;
}

/** The agent's result object, stored whole in the draft payload. */
export interface LicensurePayload {
  state: string;
  status: string;
  status_source?: string;
  status_rationale?: string;
  approval_status?: string;
  urgency?: string;
  evidence?: string[];
  requirement_source?: string;
  source_url?: string;
  last_checked?: string;
  clarity_checks?: ClarityCheck[];
  escalation_reason?: string;
  recommended_expert?: string;
  /** Set when the agent declined to adopt a status the user asked for. */
  model_proposed_status?: string;
  proposal_overridden?: boolean;
  override_note?: string;
}

export interface LicensureDraft {
  id: string;
  contractId: string;
  state: string;
  plannedCareDate: string | null;
  payload: LicensurePayload;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'escalated';
  reviewNote: string | null;
  createdAt: string;
}

export interface AnalyzeResult {
  contractId: string;
  created: number;
  failed: { state: string; error: string }[];
}

export const licensureDraftsKey = (contractId: string) =>
  ['licensure-drafts', contractId] as const;

export function useLicensureDrafts(contractId: string, enabled: boolean) {
  return useQuery<LicensureDraft[]>({
    queryKey: licensureDraftsKey(contractId),
    queryFn: USE_MOCK
      ? async () => {
          const { mockLicensureDrafts } = await import('@/lib/mock-licensure-drafts');
          return mockLicensureDrafts(contractId);
        }
      : () =>
          clientJson<LicensureDraft[]>(
            `/licensure/drafts?contractId=${encodeURIComponent(contractId)}`,
          ),
    enabled: enabled && !!contractId,
  });
}

export function useRunLicensureAnalysis(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation<AnalyzeResult, Error, { states: string[]; plannedCareDate: string }>({
    mutationFn: USE_MOCK
      ? async () => {
          // Mimic the agent's latency so the pending state is visible.
          await new Promise((r) => setTimeout(r, 900));
          return { contractId, created: 3, failed: [] };
        }
      : (vars) =>
      clientJson<AnalyzeResult>('/licensure/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contractId, ...vars }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: licensureDraftsKey(contractId) });
    },
  });
}
