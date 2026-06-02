import type { FastifyPluginAsync } from 'fastify';
import type { DrizzleDb } from '@schissel/db';
import {
  getChecklistByTenant, getChecklistTaskById,
  insertChecklistTask, updateChecklistTask, deleteChecklistTask,
} from '@schissel/db';
import { requireRole, requireMfa } from '../plugins/rbac.js';
import { NotFoundError } from '@schissel/db';

export const complianceRoutes: FastifyPluginAsync<{ db: DrizzleDb }> = async (fastify, { db }) => {

  fastify.get('/', async (request) =>
    getChecklistByTenant(db, request.tenantId),
  );

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      return await getChecklistTaskById(db, request.tenantId, request.params.id);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.status(404).send({ error: err.message });
      throw err;
    }
  });

  fastify.post<{ Body: Record<string, unknown> }>('/', {
    preHandler: [requireRole('owner', 'admin')],
  }, async (request, reply) => {
    const id = await insertChecklistTask(db, request.tenantId, (({ id, ...rest }) => rest)(request.body as any));
    return reply.status(201).send({ id });
  });

  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>('/:id', {
    preHandler: [requireRole('owner', 'admin')],
  }, async (request, reply) => {
    try {
      return await updateChecklistTask(db, request.tenantId, request.params.id, request.body as any);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.status(404).send({ error: err.message });
      throw err;
    }
  });

  fastify.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [requireRole('owner')],
  }, async (request, reply) => {
    try {
      await deleteChecklistTask(db, request.tenantId, request.params.id);
      return reply.status(204).send();
    } catch (err) {
      if (err instanceof NotFoundError) return reply.status(404).send({ error: err.message });
      throw err;
    }
  });
};
