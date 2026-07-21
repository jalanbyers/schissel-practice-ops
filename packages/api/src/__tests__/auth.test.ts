/**
 * Auth + RBAC tests.
 *
 * Every rejection path is tested before any real route is added. This suite
 * is the executable spec for the auth middleware contract:
 *
 *   - Unauthenticated requests are rejected before reaching a handler.
 *   - Tampered or expired tokens are rejected identically (no oracle).
 *   - Tokens without a tenant claim are rejected.
 *   - tenantId on request is always the value from the JWT — never from input.
 *   - RBAC gates block under-privileged roles.
 *   - MFA gate blocks tokens without the 'mfa' amr value.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import authPlugin from '../plugins/auth.js';
import { requireRole, requireMfa } from '../plugins/rbac.js';
import { createTestAuthPair, type TestAuthPair } from './helpers/make-token.js';

// ---------------------------------------------------------------------------
// Test server factory
// ---------------------------------------------------------------------------

async function buildTestServer(auth: TestAuthPair): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(authPlugin, {
    verifier: auth.verifier,
    publicPaths: ['/healthz'],
  });

  // Public health check — must mirror index.ts, which registers this route.
  // The publicPaths bypass matches on the *resolved* route pattern
  // (request.routeOptions.url), so the route has to exist for the bypass to
  // apply. See the '/healthz is reachable without a token' test.
  app.get('/healthz', async () => ({ ok: true }));

  // A protected route that echoes what the auth plugin injected into request.
  app.get('/me', async (request) => ({
    tenantId:    request.tenantId,
    userId:      request.userId,
    userRoles:   request.userRoles,
    mfaVerified: request.mfaVerified,
  }));

  // Route that requires owner or admin role.
  app.post('/licenses', {
    preHandler: [requireRole('owner', 'admin')],
  }, async () => ({ created: true }));

  // Route that requires both a role AND MFA.
  app.delete('/licenses/:id', {
    preHandler: [requireRole('owner'), requireMfa()],
  }, async () => ({ deleted: true }));

  // Viewer-only read route.
  app.get('/reports', {
    preHandler: [requireRole('viewer', 'admin', 'owner')],
  }, async () => ({ data: [] }));

  await app.ready();
  return app;
}

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const TENANT_A = 'tenant-aaaaaaaa';

let auth: TestAuthPair;
let app: FastifyInstance;

beforeAll(async () => {
  auth = await createTestAuthPair();
  app  = await buildTestServer(auth);
});

// ---------------------------------------------------------------------------
// Public routes bypass auth
// ---------------------------------------------------------------------------

describe('public paths', () => {
  it('/healthz is reachable without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).toBe(200);
  });

  it('an unregistered path is rejected with 401, not 404', async () => {
    // The bypass matches on the resolved route pattern, so an unmatched route
    // has no routeOptions.url and can never be public. Unauthenticated callers
    // get 401 for anything that is not an explicitly registered public path —
    // including paths that do not exist. This is deliberate: 404-vs-401 would
    // leak which routes exist to callers with no token.
    const res = await app.inject({ method: 'GET', url: '/not-a-real-route' });
    expect(res.statusCode).toBe(401);
  });

  it('a public path is not bypassed by query-string manipulation', async () => {
    // Matching on the route pattern rather than the raw URL means a crafted
    // query string cannot smuggle a protected path past the check.
    const res = await app.inject({ method: 'GET', url: '/me?next=/healthz' });
    expect(res.statusCode).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Missing / malformed token
// ---------------------------------------------------------------------------

describe('missing or malformed token', () => {
  it('returns 401 with no Authorization header', async () => {
    const res = await app.inject({ method: 'GET', url: '/me' });
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toMatch(/missing|malformed/i);
  });

  it('returns 401 with a non-Bearer scheme', async () => {
    const res = await app.inject({
      method: 'GET', url: '/me',
      headers: { authorization: 'Basic dXNlcjpwYXNz' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 with a Bearer prefix but empty token', async () => {
    const res = await app.inject({
      method: 'GET', url: '/me',
      headers: { authorization: 'Bearer ' },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Invalid / expired / tampered token — all must return the same 401
// (no oracle: attacker cannot distinguish expired from tampered)
// ---------------------------------------------------------------------------

describe('invalid token — no oracle', () => {
  it('returns 401 for a completely invalid token', async () => {
    const res = await app.inject({
      method: 'GET', url: '/me',
      headers: { authorization: 'Bearer not.a.jwt' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe('Invalid or expired token');
  });

  it('returns the same error message for a tampered token', async () => {
    const good = await auth.sign({ tenantId: TENANT_A });
    // Flip one character in the signature segment
    const [h, p, sig] = good.split('.');
    const tampered = [h, p, sig!.slice(0, -1) + (sig!.endsWith('x') ? 'y' : 'x')].join('.');

    const res = await app.inject({
      method: 'GET', url: '/me',
      headers: { authorization: `Bearer ${tampered}` },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe('Invalid or expired token');
  });

  it('returns 401 for an expired token (same error message)', async () => {
    const expired = await auth.sign({ tenantId: TENANT_A, expiresIn: '0s' });
    // Small delay to ensure it's past expiry
    await new Promise((r) => setTimeout(r, 10));

    const res = await app.inject({
      method: 'GET', url: '/me',
      headers: { authorization: `Bearer ${expired}` },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe('Invalid or expired token');
  });
});

// ---------------------------------------------------------------------------
// Missing tenant claim
// ---------------------------------------------------------------------------

describe('missing tenant claim', () => {
  it('returns 401 when a valid JWT has no tenant_id claim', async () => {
    // sign() with no tenantId omits the claim entirely
    const token = await auth.sign({ tenantId: undefined });
    const res = await app.inject({
      method: 'GET', url: '/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toMatch(/tenant claim/i);
  });
});

// ---------------------------------------------------------------------------
// Successful auth — request context population
// ---------------------------------------------------------------------------

describe('successful auth — context injection', () => {
  it('populates tenantId from the JWT claim — not from input', async () => {
    const token = await auth.sign({ tenantId: TENANT_A, userId: 'user-abc', roles: ['owner'], mfa: true });
    const res = await app.inject({
      method: 'GET', url: '/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.tenantId).toBe(TENANT_A);
    expect(body.userId).toBe('user-abc');
    expect(body.userRoles).toContain('owner');
    expect(body.mfaVerified).toBe(true);
  });

  it('mfaVerified is false when amr does not include mfa', async () => {
    const token = await auth.sign({ tenantId: TENANT_A, mfa: false });
    const res = await app.inject({
      method: 'GET', url: '/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().mfaVerified).toBe(false);
  });

  it('tenantId from JWT cannot be overridden by a query param', async () => {
    const token = await auth.sign({ tenantId: TENANT_A });
    const res = await app.inject({
      method: 'GET', url: '/me?tenantId=tenant-EVIL',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    // tenantId in response must be from the JWT, never the query string
    expect(res.json().tenantId).toBe(TENANT_A);
  });
});

// ---------------------------------------------------------------------------
// RBAC — role gate
// ---------------------------------------------------------------------------

describe('RBAC — requireRole', () => {
  it('allows owner to POST /licenses', async () => {
    const token = await auth.sign({ tenantId: TENANT_A, roles: ['owner'], mfa: true });
    const res = await app.inject({
      method: 'POST', url: '/licenses',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: {},
    });
    expect(res.statusCode).toBe(200);
  });

  it('allows admin to POST /licenses', async () => {
    const token = await auth.sign({ tenantId: TENANT_A, roles: ['admin'], mfa: true });
    const res = await app.inject({
      method: 'POST', url: '/licenses',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: {},
    });
    expect(res.statusCode).toBe(200);
  });

  it('blocks viewer from POST /licenses with 403', async () => {
    const token = await auth.sign({ tenantId: TENANT_A, roles: ['viewer'], mfa: true });
    const res = await app.inject({
      method: 'POST', url: '/licenses',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: {},
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toMatch(/insufficient role/i);
  });

  it('blocks a token with no roles from POST /licenses', async () => {
    const token = await auth.sign({ tenantId: TENANT_A, roles: [] });
    const res = await app.inject({
      method: 'POST', url: '/licenses',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: {},
    });
    expect(res.statusCode).toBe(403);
  });

  it('allows all roles to GET /reports', async () => {
    for (const role of ['owner', 'admin', 'viewer'] as const) {
      const token = await auth.sign({ tenantId: TENANT_A, roles: [role] });
      const res = await app.inject({
        method: 'GET', url: '/reports',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
    }
  });
});

// ---------------------------------------------------------------------------
// RBAC — MFA gate
// ---------------------------------------------------------------------------

describe('RBAC — requireMfa', () => {
  it('allows DELETE when owner + mfa both satisfied', async () => {
    const token = await auth.sign({ tenantId: TENANT_A, roles: ['owner'], mfa: true });
    const res = await app.inject({
      method: 'DELETE', url: '/licenses/abc-123',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
  });

  it('blocks DELETE with 403 when role satisfied but MFA not present', async () => {
    const token = await auth.sign({ tenantId: TENANT_A, roles: ['owner'], mfa: false });
    const res = await app.inject({
      method: 'DELETE', url: '/licenses/abc-123',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toMatch(/mfa required/i);
  });

  it('blocks DELETE with 403 when MFA present but role wrong', async () => {
    const token = await auth.sign({ tenantId: TENANT_A, roles: ['viewer'], mfa: true });
    const res = await app.inject({
      method: 'DELETE', url: '/licenses/abc-123',
      headers: { authorization: `Bearer ${token}` },
    });
    // requireRole runs first → 403 on role
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toMatch(/insufficient role/i);
  });
});
