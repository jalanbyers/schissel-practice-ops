/**
 * RBAC — role gate and MFA assertion hooks.
 *
 * Usage in a route:
 *   fastify.post('/', { preHandler: [requireRole('owner', 'admin'), requireMfa()] }, handler)
 *
 * Roles (set in Auth0 RBAC, carried in the JWT):
 *   owner  — full CRUD, all operations
 *   admin  — read + write, no destructive deletes
 *   viewer — read only
 *
 * MFA:
 *   requireMfa() checks the JWT's `amr` claim for 'mfa'.
 *   Auth0 enforces step-up auth for sensitive actions; this hook is the
 *   API-layer assertion that the policy was actually applied.
 */

import type { preHandlerHookHandler } from 'fastify';

export type Role = 'owner' | 'admin' | 'viewer';

/**
 * Returns a preHandler that allows the request only when the authenticated
 * user holds at least one of the specified roles.
 */
export function requireRole(...roles: Role[]): preHandlerHookHandler {
  return async (request, reply) => {
    const allowed = request.userRoles.some((r) => (roles as string[]).includes(r));
    if (!allowed) {
      return reply.status(403).send({ error: 'Insufficient role for this operation' });
    }
  };
}

/**
 * Returns a preHandler that requires the request to have been authenticated
 * with MFA (i.e. the JWT's `amr` claim includes 'mfa').
 *
 * Apply to any route that writes or deletes — consistent with the PHI boundary
 * rule: every data path is architected as though PHI flows through it.
 */
export function requireMfa(): preHandlerHookHandler {
  return async (request, reply) => {
    if (!request.mfaVerified) {
      return reply.status(403).send({ error: 'MFA required for this operation' });
    }
  };
}
