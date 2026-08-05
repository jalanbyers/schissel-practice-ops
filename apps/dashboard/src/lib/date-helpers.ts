// All dates in the prototype are relative to the mock "today."
// In production replace TODAY with new Date() or a server-side timestamp.
//
// Kept in step with `MOCK_SETTINGS.today` in mock-data.ts — that string is what
// the top bar prints, this constant is what every day-count badge is measured
// against. If they drift, the header claims one date while the badges compute
// from another, which is visible on screen.
export const TODAY = new Date('2026-08-05T00:00:00');

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr || !dateStr.includes('-')) return null;
  return Math.round((new Date(dateStr + 'T00:00:00').getTime() - TODAY.getTime()) / 864e5);
}

export function fmtDays(d: number | null): string {
  if (d == null) return '—';
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return 'due today';
  if (d < 60) return `in ${d}d`;
  return `in ${Math.round(d / 30)} mo`;
}

export function fmtDate(d: string | null | undefined): string {
  if (!d || !d.includes('-')) return d ?? '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export const uid = () => Math.random().toString(36).slice(2, 9);
