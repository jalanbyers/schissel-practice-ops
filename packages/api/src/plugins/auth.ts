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

// WeakMap gives each request its own roles array without sharing references.
// Fastify 5 requires getter+setter for reference types; the WeakMap is the store.
const _rolesStore = new WeakMap<object, string[]>();

/**
 * Local demo identity — a deliberate, tightly-fenced auth bypass.
 *
 * The capstone demo runs the whole stack on one machine against synthetic
 * data. Configuring an Auth0 Action to issue tenant/role claims and enrolling
 * MFA is setup work that proves nothing about the agent, and an MFA prompt
 * between recording takes is its own tax. When enabled, every request is
 * treated as a fixed tenant with owner role and MFA satisfied.
 *
 * TWO independent conditions, both required:
 *
 *   1. NODE_ENV must not be 'production'. fly.toml sets NODE_ENV=production on
 *      the deployed API, so this cannot activate there even if the variable
 *      were copied across by mistake.
 *   2. DEMO_TENANT_ID must be explicitly set. There is no default, so
 *      forgetting to set it fails closed to normal JWT verification.
 *
 * Neither alone is sufficient. If this appears in a stack trace from a real
 * environment, the fix is to unset DEMO_TENANT_ID — not to widen the guard.
 */
const DEMO_TENANT_ID = process.env['DEMO_TENANT_ID'];
const DEMO_IDENTITY_ENABLED =
  process.env.NODE_ENV !== 'production' && !!DEMO_TENANT_ID;

const authPlugin: FastifyPluginAsync<AuthPluginOptions> = async (fastify, opts) => {
  const { verifier, publicPaths = ['/healthz'] } = opts;

  if (DEMO_IDENTITY_ENABLED) {
    // Loud on purpose. An auth bypass should never be quiet about existing.
    fastify.log.warn(
      { tenantId: DEMO_TENANT_ID },
      'DEMO IDENTITY ACTIVE — every request is treated as an authenticated ' +
        'owner with MFA. Local development only. Unset DEMO_TENANT_ID to disable.',
    );
  }

  fastify.decorateRequest('tenantId',    '');
  fastify.decorateRequest('userId',      '');
  fastify.decorateRequest('userRoles', {
    getter(this: object) { return _rolesStore.get(this) ?? []; },
    setter(this: object, val: string[]) { _rolesStore.set(this, val); },
  });
  fastify.decorateRequest('mfaVerified', false);

  fastify.addHook('onRequest', async (request, reply) => {
    if (publicPaths.includes(request.routeOptions?.url ?? '')) return;

    if (DEMO_IDENTITY_ENABLED) {
      request.tenantId    = DEMO_TENANT_ID!;
      request.userId      = 'demo-physician';
      request.userRoles   = ['owner'];
      request.mfaVerified = true;
      return;
    }

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
