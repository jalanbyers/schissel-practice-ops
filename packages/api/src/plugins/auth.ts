/**
 * Auth plugin — validates Auth0 JWTs and populates request context.
 *
 * Tenant isolation contract (from CLAUDE.md + build rules):
 *   - tenantId is extracted from the JWT; the client can never supply or
 *     override it. It flows in from the left (token), never from the right
 *     (query string / body).
 *   - Every request that reaches a route handler has a verified tenantId.
 *     There is no code path where tenantId is null or undefined in a handler.
 */

import fp from 'fastify-plugin';
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
} from 'jose';
import type { FastifyPluginAsync } from 'fastify';

// Custom Auth0 claim namespaces — must match the Auth0 Action that sets them.
export const TENANT_CLAIM = 'https://schissel.app/tenant_id' as const;
export const ROLES_CLAIM  = 'https://schissel.app/roles' as const;

export interface Auth0Payload extends JWTPayload {
  [TENANT_CLAIM]: string;
  [ROLES_CLAIM]: string[];
  /** Authentication Method References — includes 'mfa' when step-up auth used */
  amr?: string[];
}

/**
 * Injectable verifier — accepts a raw Bearer token, returns a typed payload
 * or throws. Swap this for a test double in unit tests; use makeAuth0Verifier
 * in production.
 */
export type JwtVerifier = (token: string) => Promise<Auth0Payload>;

/** Production verifier: fetches Auth0's JWKS and validates RS256 signatures. */
export function makeAuth0Verifier(domain: string, audience: string): JwtVerifier {
  const jwks: JWTVerifyGetKey = createRemoteJWKSet(
    new URL(`https://${domain}/.well-known/jwks.json`),
  );
  return async (token) => {
    const { payload } = await jwtVerify(token, jwks, {
      issuer:   `https://${domain}/`,
      audience,
    });
    return payload as Auth0Payload;
  };
}

export interface AuthPluginOptions {
  verifier: JwtVerifier;
  /** URL paths that skip auth. Defaults to ['/healthz']. */
  publicPaths?: string[];
}

const authPlugin: FastifyPluginAsync<AuthPluginOptions> = async (fastify, opts) => {
  const { verifier, publicPaths = ['/healthz'] } = opts;

  // Decorate request so TypeScript knows these fields exist on every handler.
  // Handlers must never be reached without these being set (enforced below).
  fastify.decorateRequest('tenantId',    '');
  fastify.decorateRequest('userId',      '');
  // Arrays are reference types — Fastify 5 requires getter/setter interface
  fastify.decorateRequest('userRoles', {
    getter() { return [] as string[]; },
  });
  fastify.decorateRequest('mfaVerified', false);

  fastify.addHook('onRequest', async (request, reply) => {
    if (publicPaths.includes(request.routeOptions?.url ?? '')) return;

    const authHeader = request.headers['authorization'];
    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.slice(7);
    let payload: Auth0Payload;

    try {
      payload = await verifier(token);
    } catch {
      // Do not leak whether the token was expired vs. invalid vs. tampered.
      return reply.status(401).send({ error: 'Invalid or expired token' });
    }

    const tenantId = payload[TENANT_CLAIM];
    if (!tenantId || typeof tenantId !== 'string') {
      // Token is structurally valid but missing the tenant claim — reject.
      // This would indicate a misconfigured Auth0 Action.
      return reply.status(401).send({ error: 'Token is missing tenant claim' });
    }

    request.tenantId   = tenantId;
    request.userId     = payload.sub ?? '';
    request.userRoles  = Array.isArray(payload[ROLES_CLAIM]) ? payload[ROLES_CLAIM] : [];
    request.mfaVerified = Array.isArray(payload.amr) && payload.amr.includes('mfa');
  });
};

export default fp(authPlugin, {
  name: 'auth',
  fastify: '5.x',
});
