import type { FastifyPluginAsync } from 'fastify';
import type { DrizzleDb } from '@schissel/db';
import { getSettings, upsertSettings } from '@schissel/db';
import { requireRole } from '../plugins/rbac.js';

export const settingsRoutes: FastifyPluginAsync<{ db: DrizzleDb }> = async (fastify, { db }) => {

  fastify.get('/', async (request) => {
    const row = await getSettings(db, request.tenantId);
    // Return defaults if no settings row exists yet
    return row ?? {
      tenantId: request.tenantId,
      name: '', entity: '', homeState: '',
      npi: null, ein: null, email: null, phone: null,
      timezone: 'America/New_York',
      taxRate: '0.27',
      notifications: {
        licenseRenewals: true, recredentialing: true,
        complianceDue: true, weeklyDigest: false, leadDays: 30,
      },
    };
  });

  fastify.patch<{ Body: Record<string, unknown> }>('/', {
    preHandler: [requireRole('owner', 'admin')],
  }, async (request) =>
    upsertSettings(db, request.tenantId, request.body as any),
  );
};
