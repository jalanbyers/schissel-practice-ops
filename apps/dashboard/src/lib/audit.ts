'use client';

import { useState, useEffect } from 'react';

export type AuditAction = 'create' | 'update' | 'delete' | 'toggle';
export type AuditEntity = 'license' | 'payer' | 'engagement' | 'ledger' | 'task';

export interface AuditEvent {
  id: string;
  ts: string;           // ISO timestamp
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  label: string;        // human-readable: e.g. "License CA saved"
  tenantId: string;     // placeholder — supplied by auth middleware in production
}

// Module-level ring buffer — persists across component mounts within a session.
// In production, replace emitAudit() with an authenticated API POST to the
// audit_log table (tenant_id scoped, append-only).
const MAX_EVENTS = 200;
let events: AuditEvent[] = [];
const subscribers = new Set<() => void>();

export function emitAudit(
  event: Omit<AuditEvent, 'id' | 'ts'>,
): void {
  const full: AuditEvent = {
    ...event,
    id: Math.random().toString(36).slice(2, 9),
    ts: new Date().toISOString(),
  };
  events = [full, ...events].slice(0, MAX_EVENTS);
  subscribers.forEach(fn => fn());
}

/** React hook — subscribes to the audit log and re-renders on new events. */
export function useAuditLog(): AuditEvent[] {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force(x => x + 1);
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }, []);
  return events;
}
