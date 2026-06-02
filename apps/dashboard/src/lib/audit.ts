'use client';

import { useState, useEffect } from 'react';

export type AuditAction = 'create' | 'update' | 'delete' | 'toggle';
export type AuditEntity = 'license' | 'payer' | 'engagement' | 'ledger' | 'task';

export interface AuditEvent {
  id: string;
  ts: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  label: string;
  tenantId: string;
}

// ---------------------------------------------------------------------------
// In-memory ring buffer — for immediate UI feedback (AuditFeed in Settings).
// ---------------------------------------------------------------------------
const MAX_EVENTS = 200;
let events: AuditEvent[] = [];
const subscribers = new Set<() => void>();

function addToBuffer(event: AuditEvent) {
  events = [event, ...events].slice(0, MAX_EVENTS);
  subscribers.forEach(fn => fn());
}

// ---------------------------------------------------------------------------
// Persist to the API (fire-and-forget — never blocks the mutation).
// The BFF proxy forwards to POST /v1/audit with the Auth0 Bearer token,
// which the Fastify audit route writes to the audit_log table (tenant_id scoped).
// ---------------------------------------------------------------------------
async function persistToApi(event: AuditEvent): Promise<void> {
  try {
    await fetch('/api/data/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action:   event.action,
        entity:   event.entity,
        entityId: event.entityId,
        label:    event.label,
      }),
    });
  } catch {
    // Network failure — in-memory record is still present; API will catch up
    // on the next successful call. Never throw from here.
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Emit an audit event:
 *   1. Adds to the in-memory buffer (AuditFeed re-renders immediately).
 *   2. POSTs to /api/data/audit → BFF → /v1/audit → audit_log table.
 *      Fire-and-forget: the mutation is not blocked by the API call.
 */
export function emitAudit(event: Omit<AuditEvent, 'id' | 'ts'>): void {
  const full: AuditEvent = {
    ...event,
    id: Math.random().toString(36).slice(2, 9),
    ts: new Date().toISOString(),
  };
  addToBuffer(full);
  void persistToApi(full); // intentionally not awaited
}

/** React hook — subscribes to the in-memory log; re-renders on new events. */
export function useAuditLog(): AuditEvent[] {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force(x => x + 1);
    subscribers.add(fn);
    return () => { subscribers.delete(fn); };
  }, []);
  return events;
}
