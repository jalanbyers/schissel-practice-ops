// All dates in the prototype are relative to the mock "today."
// In production replace TODAY with new Date() or a server-side timestamp.
const TODAY = new Date('2026-06-01T00:00:00');

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
