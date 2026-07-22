'use client';

import { useState } from 'react';
import { AlertTriangle, Check, ChevronDown, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { StatusPill } from '@/components/ui/StatusPill';
import { US_GRID, US_NAMES } from '@/lib/us-grid';
import {
  useLicensureDrafts,
  useRunLicensureAnalysis,
  type ClarityCheck,
  type LicensureDraft,
} from '@/hooks/use-licensure-drafts';

/**
 * Licensure review for an engagement's required states.
 *
 * Lives under Onboarding requirements because that is where the physician is
 * already thinking about what a contract obliges them to do before they can
 * take patients.
 *
 * Everything here is a DRAFT. The agent has no way to publish, and this
 * component has no approve action yet — approval lands in slice 2. Drafts are
 * styled distinctly so they are never mistaken for settled licence data.
 */

const STATUS_LABEL: Record<string, { label: string; variant: string }> = {
  license_current:         { label: 'License current',       variant: 'ok' },
  renewal_needed:          { label: 'Renewal needed',        variant: 'warn' },
  application_in_progress: { label: 'Application in progress', variant: 'info' },
  new_application_needed:  { label: 'New application needed', variant: 'info' },
  human_review_required:   { label: 'Human review required', variant: 'warn' },
};

/**
 * Render the requirement text with the agent's quoted span marked.
 *
 * This is the part that makes the judgment auditable. The agent may only
 * escalate on language if it quotes the offending text verbatim, so the
 * physician can see exactly which sentences conflict rather than taking
 * "ambiguous" on trust.
 *
 * If the span is not found the text is shown plain — better a missing
 * highlight than a silent mismatch that implies the quote was verified.
 */
function HighlightedRequirement({ text, span }: { text: string; span?: string }) {
  if (!span || !text.includes(span)) {
    return <p className="req-prose">{text}</p>;
  }
  const at = text.indexOf(span);
  return (
    <p className="req-prose">
      {text.slice(0, at)}
      <mark className="req-conflict">{span}</mark>
      {text.slice(at + span.length)}
    </p>
  );
}

function ClarityRow({ check }: { check: ClarityCheck }) {
  const failed = String(check.verdict).toLowerCase() === 'fail';
  return (
    <div className={`clarity-row${failed ? ' failed' : ''}`}>
      <span className="clarity-icon">
        {failed ? <AlertTriangle size={13} /> : <Check size={13} />}
      </span>
      <span className="clarity-num">Condition {check.condition_number}</span>
      <span className="clarity-reason">{check.reasoning ?? (failed ? 'failed' : 'passed')}</span>
    </div>
  );
}

function DraftCard({ draft }: { draft: LicensureDraft }) {
  const [open, setOpen] = useState(false);
  const p = draft.payload;
  const meta = STATUS_LABEL[p.status] ?? { label: p.status, variant: 'idle' };
  const condition4 = p.clarity_checks?.find((c) => c.condition_number === 4);
  const conflictSpan = condition4?.quoted_span;

  return (
    <div className={`draft-card${p.urgency === 'urgent' ? ' urgent' : ''}`}>
      <button type="button" className="draft-head" onClick={() => setOpen((v) => !v)}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="mono draft-state">{draft.state}</span>
        <span className="draft-name">{US_NAMES[draft.state] ?? draft.state}</span>
        <StatusPill variant={meta.variant as never} label={meta.label} />
        {p.urgency === 'urgent' && <span className="mini-badge warn">Urgent</span>}
        <span className="draft-pending">Pending your review</span>
      </button>

      {open && (
        <div className="draft-body">
          {/* The agent declining to say what it was asked to say. */}
          {p.proposal_overridden && (
            <div className="override-note">
              <AlertTriangle size={14} />
              <div>
                <strong>The records disagree with the requested status.</strong>
                <div>{p.override_note}</div>
              </div>
            </div>
          )}

          {p.status_rationale && (
            <div className="dgroup-mini">
              <span className="dgroup-title">Why this status</span>
              <p className="req-prose">{p.status_rationale}</p>
            </div>
          )}

          {p.clarity_checks && p.clarity_checks.length > 0 && (
            <div className="dgroup-mini">
              <span className="dgroup-title">Clarity checks</span>
              {p.clarity_checks.map((c) => (
                <ClarityRow key={c.condition_number} check={c} />
              ))}
            </div>
          )}

          {conflictSpan && (
            <div className="dgroup-mini">
              <span className="dgroup-title">
                Conflicting text
                {condition4?.failure_mode && (
                  <span className="mini-badge"> {condition4.failure_mode.replace(/_/g, ' ')}</span>
                )}
              </span>
              <HighlightedRequirement text={conflictSpan} span={conflictSpan} />
              {condition4?.reasoning && <p className="req-note">{condition4.reasoning}</p>}
            </div>
          )}

          {p.escalation_reason && (
            <div className="dgroup-mini">
              <span className="dgroup-title">Why this needs review</span>
              <p className="req-prose">{p.escalation_reason}</p>
              {p.recommended_expert && (
                <p className="req-note">Recommended: {p.recommended_expert}</p>
              )}
            </div>
          )}

          <div className="draft-meta">
            {p.requirement_source && (
              <span>
                Source:{' '}
                {p.source_url ? (
                  <a href={p.source_url} target="_blank" rel="noreferrer noopener">
                    {p.requirement_source}
                  </a>
                ) : (
                  p.requirement_source
                )}
              </span>
            )}
            {p.last_checked && <span>Last checked {p.last_checked}</span>}
            {p.evidence?.length ? <span className="mono">{p.evidence.join(', ')}</span> : null}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  /** Engagement id, used as the contract identifier for drafts. */
  contractId: string;
  /** New engagements have no id yet, so analysis is unavailable until saved. */
  saved: boolean;
}

export function LicensureAnalysis({ contractId, saved }: Props) {
  const [states, setStates] = useState<string[]>([]);
  const [careDate, setCareDate] = useState('');

  const { data: drafts, isLoading } = useLicensureDrafts(contractId, saved);
  const run = useRunLicensureAnalysis(contractId);

  const toggle = (code: string) =>
    setStates((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  const canRun = saved && states.length > 0 && !!careDate && !run.isPending;

  return (
    <div className="dgroup">
      <div className="dgroup-head">
        <span className="dgroup-title">Licensure review</span>
        {drafts?.length ? <span className="dgroup-meta">{drafts.length} drafts</span> : null}
      </div>

      {!saved && (
        <div className="empty-mini">
          Save this engagement first — analysis is stored against the contract.
        </div>
      )}

      {saved && (
        <>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="care-date">Planned first patient-care date</label>
              <input
                id="care-date"
                type="date"
                className="input"
                value={careDate}
                onChange={(e) => setCareDate(e.target.value)}
              />
            </div>
          </div>

          <div className="state-chips" role="group" aria-label="Required states">
            {US_GRID.map(([code]) => (
              <button
                key={code}
                type="button"
                className={`state-chip${states.includes(code) ? ' on' : ''}`}
                aria-pressed={states.includes(code)}
                onClick={() => toggle(code)}
              >
                {code}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn primary"
            disabled={!canRun}
            onClick={() => run.mutate({ states, plannedCareDate: careDate })}
          >
            {run.isPending ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />}
            {run.isPending ? 'Analyzing…' : 'Analyze required states'}
          </button>

          {run.isError && (
            <div className="empty-mini error">{run.error.message}</div>
          )}
          {run.data?.failed?.length ? (
            <div className="empty-mini error">
              Not analyzed: {run.data.failed.map((f) => `${f.state} (${f.error})`).join('; ')}
            </div>
          ) : null}

          {isLoading && <div className="empty-mini">Loading drafts…</div>}

          {drafts?.map((d) => <DraftCard key={d.id} draft={d} />)}

          {drafts?.length ? (
            <p className="req-note">
              These are drafts. Nothing here is posted to Licensing until you approve it.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
