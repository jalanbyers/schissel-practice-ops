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
      // Mock mode has no server state to resync with — the fixtures are static
      // and always pending, so refetching would immediately undo the decision
      // the physician just made.
      if (!USE_MOCK) {
        void queryClient.invalidateQueries({ queryKey: licensureDraftsKey(contractId) });
      }
    },
  });
}

export interface OverrideRequestResult {
  accepted: boolean;
  state: string;
  requestedStatus: string;
  derivedStatus: string;
  rationale: string | null;
  statusSource: string;
  message: string;
}

/**
 * Ask for a status the records do not support, and be declined on screen.
 *
 * Not part of `useReviewDraft`: an edit is *accepted* verbatim, so routing this
 * through it would show the requested status rather than the refusal. This hits
 * a separate endpoint that compares the request against the status computed from
 * the records, records the attempt, and returns the decline.
 *
 * The result is held in component state rather than written into the draft. The
 * draft is unchanged — that is the point — so there is nothing to invalidate.
 */
export function useRequestOverride() {
  return useMutation<OverrideRequestResult, Error, { draftId: string; requestedStatus: string }>({
    mutationFn: async ({ draftId, requestedStatus }) => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 350));
        return {
          accepted: false,
          state: '',
          requestedStatus,
          derivedStatus: 'renewal_needed',
          rationale: 'license expires 2026-09-18, which is 13 days BEFORE the planned first patient-care date 2026-10-01',
          statusSource: 'derived_from_records',
          message:
            'The status is computed from the records, not proposed — so this cannot be granted. Your request is recorded.',
        };
      }
      return clientJson<OverrideRequestResult>(
        `/licensure/drafts/${encodeURIComponent(draftId)}/override-request`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ requestedStatus }),
        },
      );
    },
  });
}

export type ReviewDecision = 'approve' | 'edit' | 'reject' | 'escalate';

/**
 * Record a physician's decision. Server-side this is gated on role and MFA —
 * it is the moment a machine-generated assessment becomes something a
 * physician has signed off on.
 */
export function useReviewDraft(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    LicensureDraft,
    Error,
    { draftId: string; decision: ReviewDecision; note?: string; payload?: LicensurePayload }
  >({
    mutationFn: async ({ draftId, decision, note, payload }) => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        return {
          id: draftId,
          contractId,
          state: '',
          plannedCareDate: null,
          payload: (payload ?? {}) as LicensurePayload,
          approvalStatus:
            decision === 'reject' ? 'rejected' : decision === 'escalate' ? 'escalated' : 'approved',
          reviewNote: note ?? null,
          createdAt: new Date().toISOString(),
        };
      }
      return clientJson<LicensureDraft>(`/licensure/drafts/${encodeURIComponent(draftId)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision, note, payload }),
      });
    },
    onSuccess: (updated, vars) => {
      // Update in place so the card re-renders as decided without a refetch —
      // mock mode has no server to refetch from.
      queryClient.setQueryData<LicensureDraft[]>(licensureDraftsKey(contractId), (prev) =>
        prev?.map((d) =>
          d.id === vars.draftId
            ? { ...d, approvalStatus: updated.approvalStatus, reviewNote: updated.reviewNote }
            : d,
        ),
      );
      // Mock mode has no server state to resync with — the fixtures are static
      // and always pending, so refetching would immediately undo the decision
      // the physician just made.
      if (!USE_MOCK) {
        void queryClient.invalidateQueries({ queryKey: licensureDraftsKey(contractId) });
      }
    },
  });
}
