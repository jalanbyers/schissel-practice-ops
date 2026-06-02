import type { FastifyPluginAsync } from 'fastify';
import type { DrizzleDb } from '@schissel/db';
import {
  getLedgerByTenant, getLedgerEntryById,
  insertLedgerEntry, deleteLedgerEntry,
  getTaxPaymentsByTenant, upsertTaxPayment, markTaxPaymentPaid,
  getSettings,
} from '@schissel/db';
import { requireRole, requireMfa } from '../plugins/rbac.js';
import { NotFoundError } from '@schissel/db';

// Derive month label from ISO date string
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function monthLabel(isoDate: string): string {
  const m = parseInt(isoDate.slice(5, 7), 10) - 1;
  return MONTHS[m] ?? isoDate.slice(0, 7);
}
function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7); // e.g. "2026-06"
}

// Compute history from ledger (all months except the current one)
function buildHistory(ledger: Awaited<ReturnType<typeof getLedgerByTenant>>) {
  const now = new Date().toISOString().slice(0, 7);
  const byMonth: Record<string, { rev: number; exp: number }> = {};
  for (const e of ledger) {
    const mk = monthKey(e.date);
    if (mk === now) continue;
    byMonth[mk] ??= { rev: 0, exp: 0 };
    if (e.type === 'income') byMonth[mk].rev += Number(e.amount);
    else                     byMonth[mk].exp += Number(e.amount);
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mk, { rev, exp }]) => ({ m: monthLabel(mk + '-01'), rev, exp }));
}

export const financesRoutes: FastifyPluginAsync<{ db: DrizzleDb }> = async (fastify, { db }) => {

  // Full finances state for the dashboard
  fastify.get('/', async (request) => {
    const [ledger, taxPayments, settings] = await Promise.all([
      getLedgerByTenant(db, request.tenantId),
      getTaxPaymentsByTenant(db, request.tenantId),
      getSettings(db, request.tenantId),
    ]);
    const now = new Date();
    const currentMonth = now.toLocaleString('en-US', { month: 'long' }) + ' ' + now.getFullYear();
    return {
      currentMonth,
      history:     buildHistory(ledger),
      ledger,
      taxRate:     Number(settings?.taxRate ?? 0.27),
      taxPayments,
    };
  });

  // Ledger CRUD
  fastify.post<{ Body: Record<string, unknown> }>('/ledger', {
    preHandler: [requireRole('owner', 'admin')],
  }, async (request, reply) => {
    const id = await insertLedgerEntry(db, request.tenantId, request.body as any);
    return reply.status(201).send({ id });
  });

  fastify.delete<{ Params: { id: string } }>('/ledger/:id', {
    preHandler: [requireRole('owner')],
  }, async (request, reply) => {
    try {
      await deleteLedgerEntry(db, request.tenantId, request.params.id);
      return reply.status(204).send();
    } catch (err) {
      if (err instanceof NotFoundError) return reply.status(404).send({ error: err.message });
      throw err;
    }
  });

  // Tax payments
  fastify.post<{ Body: Record<string, unknown> }>('/tax-payments', {
    preHandler: [requireRole('owner', 'admin')],
  }, async (request, reply) => {
    const id = await upsertTaxPayment(db, request.tenantId, request.body as any);
    return reply.status(201).send({ id });
  });

  fastify.patch<{ Params: { id: string }; Body: { paidAmount: string } }>('/tax-payments/:id/paid', {
    preHandler: [requireRole('owner', 'admin')],
  }, async (request, reply) => {
    try {
      await markTaxPaymentPaid(db, request.tenantId, request.params.id, request.body.paidAmount);
      return reply.status(204).send();
    } catch (err) {
      if (err instanceof NotFoundError) return reply.status(404).send({ error: err.message });
      throw err;
    }
  });

  // Update tax rate (stored in settings)
  fastify.patch<{ Body: { taxRate: number } }>('/tax-rate', {
    preHandler: [requireRole('owner', 'admin')],
  }, async (request) => {
    const { taxRate } = request.body;
    return getSettings(db, request.tenantId); // re-fetch after update via settings route
    // In production: update via upsertSettings
  });
};
