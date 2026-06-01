export type StatusVariant = 'ok' | 'warn' | 'bad' | 'info' | 'idle';

interface StatusPillProps {
  variant: StatusVariant;
  label: string;
}

export function StatusPill({ variant, label }: StatusPillProps) {
  return (
    <span className={`pill ${variant}`}>
      <span className="dot" />
      {label}
    </span>
  );
}

// Convenience maps — match the design's status enum values to pill variants.
export const STATE_STATUS: Record<string, { variant: StatusVariant; label: string }> = {
  active:   { variant: 'ok',   label: 'Active' },
  progress: { variant: 'info', label: 'In progress' },
  expiring: { variant: 'warn', label: 'Expiring soon' },
  none:     { variant: 'idle', label: 'Not licensed' },
};
export const PAYER_STATUS: Record<string, { variant: StatusVariant; label: string }> = {
  approved:   { variant: 'ok',   label: 'Approved' },
  review:     { variant: 'info', label: 'In review' },
  submitted:  { variant: 'warn', label: 'Submitted' },
  notstarted: { variant: 'idle', label: 'Not started' },
};
export const ENG_STATUS: Record<string, { variant: StatusVariant; label: string }> = {
  active:   { variant: 'ok',   label: 'Active' },
  hold:     { variant: 'warn', label: 'On hold' },
  prospect: { variant: 'info', label: 'Prospect' },
  ended:    { variant: 'idle', label: 'Ended' },
};
export const CHK_STATUS: Record<string, { variant: StatusVariant; label: string }> = {
  done:       { variant: 'ok',   label: 'Done' },
  progress:   { variant: 'warn', label: 'In progress' },
  notstarted: { variant: 'idle', label: 'Not started' },
};
