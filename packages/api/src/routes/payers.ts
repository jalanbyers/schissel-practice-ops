import type { FastifyPluginAsync } from 'fastify';
import type { DrizzleDb } from '@schissel/db';
import {
  getPayersByTenant, getPayerById,
  insertPayer, updatePayer, deletePayer,
} from '@schissel/db';
import { requireRole, requireMfa } from '../plugins/rbac.js';
import { NotFoundError } from '@schissel/db';

export const payersRoutes: FastifyPluginAsync<{ db: DrizzleDb }> = async (fastify, { db }) => {

  fastify.get('/', async (request) =>
    getPayersByTenant(db, request.tenantId),
  );

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      return await getPayerById(db, request.tenantId, request.params.id);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.status(404).send({ error: err.message });
      throw err;
    }
  });

  fastify.post<{ Body: Record<string, unknown> }>('/', {
    preHandler: [requireRole('owner', 'admin')],
  }, async (request, reply) => {
    const id = await insertPayer(db, request.tenantId, request.body as any);
    return reply.status(201).send({ id });
  });

  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>('/:id', {
    preHandler: [requireRole('owner', 'admin')],
  }, async (request, reply) => {
    try {
      return await updatePayer(db, request.tenantId, request.params.id, request.body as any);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.status(404).send({ error: err.message });
      throw err;
    }
  });

  fastify.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [requireRole('owner')],
  }, async (request, reply) => {
    try {
      await deletePayer(db, request.tenantId, request.params.id);
      return reply.status(204).send();
    } catch (err) {
      if (err instanceof NotFoundError) return reply.status(404).send({ error: err.message });
      throw err;
    }
  });
};
