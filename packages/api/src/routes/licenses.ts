import type { FastifyPluginAsync } from 'fastify';
import type { DrizzleDb } from '@schissel/db';
import {
  getLicensesByTenant,
  insertLicense,
  getLicenseByCode,
  updateLicenseByCode,
  deleteLicenseByCode,
} from '@schissel/db';
import { requireRole } from '../plugins/rbac.js';
import { NotFoundError } from '@schissel/db';

export const licensesRoutes: FastifyPluginAsync<{ db: DrizzleDb }> = async (fastify, { db }) => {

  // List all licenses for this tenant
  fastify.get('/', async (request) =>
    getLicensesByTenant(db, request.tenantId),
  );

  // Get by state code (e.g. /licenses/CA)
  fastify.get<{ Params: { code: string } }>('/:code', async (request, reply) => {
    try {
      return await getLicenseByCode(db, request.tenantId, request.params.code.toUpperCase());
    } catch (err) {
      if (err instanceof NotFoundError) return reply.status(404).send({ error: err.message });
      throw err;
    }
  });

  // Create a new license (strip client-supplied id if any)
  fastify.post<{ Body: Record<string, unknown> }>('/', {
    preHandler: [requireRole('owner', 'admin')],
  }, async (request, reply) => {
    const { id: _id, ...data } = request.body as any;
    const id = await insertLicense(db, request.tenantId, data);
    return reply.status(201).send({ id });
  });

  // Update by state code
  fastify.patch<{ Params: { code: string }; Body: Record<string, unknown> }>('/:code', {
    preHandler: [requireRole('owner', 'admin')],
  }, async (request, reply) => {
    try {
      const { id: _id, code: _code, ...data } = request.body as any;
      return await updateLicenseByCode(db, request.tenantId, request.params.code.toUpperCase(), data);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.status(404).send({ error: err.message });
      throw err;
    }
  });

  // Delete by state code
  fastify.delete<{ Params: { code: string } }>('/:code', {
    preHandler: [requireRole('owner')],
  }, async (request, reply) => {
    try {
      await deleteLicenseByCode(db, request.tenantId, request.params.code.toUpperCase());
      return reply.status(204).send();
    } catch (err) {
      if (err instanceof NotFoundError) return reply.status(404).send({ error: err.message });
      throw err;
    }
  });
};
