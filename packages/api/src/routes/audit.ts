import type { FastifyPluginAsync } from 'fastify';
import type { DrizzleDb } from '@schissel/db';
import { insertAuditEvent, getAuditLogByTenant } from '@schissel/db';
import { requireRole } from '../plugins/rbac.js';

interface AuditBody {
  action: string;
  entity: string;
  entityId: string;
  label: string;
}

export const auditRoutes: FastifyPluginAsync<{ db: DrizzleDb }> = async (fastify, { db }) => {

  /**
   * POST /v1/audit — append a client-emitted audit event.
   *
   * The browser's emitAudit() calls /api/data/audit (BFF proxy) which
   * forwards here with the authenticated tenant_id from the JWT.
   * The client cannot forge or omit tenant_id — it comes from request.tenantId.
   */
  fastify.post<{ Body: AuditBody }>('/', {
    preHandler: [requireRole('owner', 'admin', 'viewer')],
  }, async (request, reply) => {
    const { action, entity, entityId, label } = request.body;
    const id = await insertAuditEvent(db, request.tenantId, {
      action,
      entity,
      entityId,
      label,
      userId: request.userId || null,
    });
    return reply.status(201).send({ id });
  });

  /**
   * GET /v1/audit — fetch the most recent 100 events for this tenant.
   * Used by the Settings activity log.
   */
  fastify.get('/', {
    preHandler: [requireRole('owner', 'admin', 'viewer')],
  }, async (request) =>
    getAuditLogByTenant(db, request.tenantId),
  );
};
