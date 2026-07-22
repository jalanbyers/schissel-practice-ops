import type { LicensureDraft } from '@/hooks/use-licensure-drafts';

/**
 * Mock licensure drafts for `NEXT_PUBLIC_USE_MOCK=true`.
 *
 * The dashboard's other sections all have a mock path so the UI runs without
 * Postgres, the Fastify API, or a running agent. This adds the same for
 * licensure review — otherwise the feature needs four services before anything
 * appears on screen, which makes it undemoable.
 *
 * These are not invented shapes. Each payload is a real agent result copied
 * from an eval trace, including the verbatim Ohio span, so what the mock shows
 * is what the agent actually produces.
 */

const OHIO_CONFLICT =
  'physicians holding an active compact privilege may deliver telehealth ' +
  'services to patients located in Ohio without a separate Ohio license. ' +
  'Physicians providing telehealth services to patients located in Ohio must ' +
  'hold a full unrestricted Ohio medical license issued by the State Medical ' +
  'Board of Ohio prior to the first patient encounter.';

const base = (contractId: string) => ({
  contractId,
  plannedCareDate: '2026-10-01',
  approvalStatus: 'pending' as const,
  reviewNote: null,
  createdAt: '2026-07-22T09:00:00.000Z',
});

export function mockLicensureDrafts(contractId: string): LicensureDraft[] {
  return [
    {
      ...base(contractId),
      id: 'mock-draft-oh',
      state: 'OH',
      payload: {
        state: 'OH',
        status: 'human_review_required',
        status_source: 'derived_from_records',
        approval_status: 'pending_physician_review',
        urgency: 'review',
        evidence: ['SYN-REQ-OH'],
        requirement_source: 'State Medical Board of Ohio',
        source_url: 'https://med.ohio.gov',
        last_checked: '2026-07-15',
        clarity_checks: [
          { condition_number: 1, verdict: 'pass', reasoning: 'requirement last checked 2026-07-15, 78 days before the planned care date 2026-10-01 (within the 90-day window)' },
          { condition_number: 2, verdict: 'pass', reasoning: "source 'State Medical Board of Ohio' at med.ohio.gov is a recognized official board or state source" },
          { condition_number: 3, verdict: 'pass', reasoning: 'all required fields present' },
          {
            condition_number: 4,
            verdict: 'fail',
            failure_mode: 'internal_contradiction',
            quoted_span: OHIO_CONFLICT,
            reasoning:
              'The record first states that compact privilege holders may practice telehealth without a separate Ohio license, then states that a full unrestricted Ohio license is required before the first patient encounter. Both cannot be acted on.',
          },
        ],
        escalation_reason:
          'condition 4 failed: two statements in the requirement cannot both be acted on',
        recommended_expert: 'licensing or compliance expert',
      },
    },
    {
      ...base(contractId),
      id: 'mock-draft-fl',
      state: 'FL',
      payload: {
        state: 'FL',
        status: 'renewal_needed',
        status_source: 'derived_from_records',
        status_rationale:
          'license expires 2026-07-20, which is 73 days BEFORE the planned first patient-care date 2026-10-01',
        approval_status: 'pending_physician_review',
        urgency: 'urgent',
        evidence: ['SYN-REQ-FL'],
        requirement_source: 'Florida Board of Medicine',
        source_url: 'https://flboardofmedicine.gov',
        last_checked: '2026-07-16',
        clarity_checks: [
          { condition_number: 1, verdict: 'pass', reasoning: 'within the 90-day window' },
          { condition_number: 2, verdict: 'pass', reasoning: 'official board source' },
          { condition_number: 3, verdict: 'pass', reasoning: 'all required fields present' },
          { condition_number: 4, verdict: 'pass', reasoning: 'requirement text is unambiguous' },
        ],
        escalation_reason: '',
        recommended_expert: 'licensing or credentialing expert',
        // The agent declining to adopt a status it was asked for.
        model_proposed_status: 'license_current',
        proposal_overridden: true,
        override_note:
          "proposed status 'license_current' was not accepted; the records show 'renewal_needed' because license expires 2026-07-20, which is 73 days BEFORE the planned first patient-care date 2026-10-01",
      },
    },
    {
      ...base(contractId),
      id: 'mock-draft-ca',
      state: 'CA',
      payload: {
        state: 'CA',
        status: 'license_current',
        status_source: 'derived_from_records',
        status_rationale:
          'license valid until 2026-12-31, 91 days beyond the planned care date 2026-10-01',
        approval_status: 'pending_physician_review',
        urgency: 'normal',
        evidence: ['SYN-REQ-CA'],
        requirement_source: 'Medical Board of California',
        source_url: 'https://www.mbc.ca.gov',
        last_checked: '2026-07-15',
        clarity_checks: [
          { condition_number: 1, verdict: 'pass', reasoning: 'within the 90-day window' },
          { condition_number: 2, verdict: 'pass', reasoning: 'official board source' },
          { condition_number: 3, verdict: 'pass', reasoning: 'all required fields present' },
          { condition_number: 4, verdict: 'pass', reasoning: 'requirement text is unambiguous' },
        ],
        escalation_reason: '',
        recommended_expert: '',
      },
    },
  ];
}
