/**
 * Licenses routes — proof-of-pattern for step 2.
 *
 * Shows how tenantId flows: JWT → request.tenantId → query helper.
 * The client cannot influence which tenant's data is returned.
 */

import type { FastifyPluginAsync } from 'fastify';
import type { DrizzleDb } from '@schissel/db';
import {
  getLicensesByTenant,
  getLicenseById,
  insertLicense,
  updateLicense,
  deleteLicense,
} from '@schissel/db';
import { requireRole, requireMfa } from '../plugins/rbac.js';
import { NotFoundError } from '@schissel/db';

export const licensesRoutes: FastifyPluginAsync<{ db: DrizzleDb }> = async (fastify, { db }) => {

  fastify.get('/', async (request) => {
    return getLicensesByTenant(db, request.tenantId);
  });

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      return await getLicenseById(db, request.tenantId, request.params.id);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.status(404).send({ error: err.message });
      throw err;
    }
  });

  fastify.post<{ Body: { code: string; name: string; status?: string } }>('/', {
    preHandler: [requireRole('owner', 'admin')],
  }, async (request, reply) => {
    const { code, name, status } = request.body;
    const id = await insertLicense(db, request.tenantId, {
      code,
      name,
      status: (status as 'active' | 'progress' | 'expiring' | 'none') ?? 'progress',
    });
    return reply.status(201).send({ id });
  });

  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>('/:id', {
    preHandler: [requireRole('owner', 'admin')],
  }, async (request, reply) => {
    try {
      return await updateLicense(db, request.tenantId, request.params.id, request.body);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.status(404).send({ error: err.message });
      throw err;
    }
  });

  fastify.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [requireRole('owner')],
  }, async (request, reply) => {
    try {
      await deleteLicense(db, request.tenantId, request.params.id);
      return reply.status(204).send();
    } catch (err) {
      if (err instanceof NotFoundError) return reply.status(404).send({ error: err.message });
      throw err;
    }
  });
};
