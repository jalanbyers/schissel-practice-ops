/**
 * The local demo identity is an auth bypass, so these tests are mostly about
 * proving it stays off.
 *
 * It is guarded by two independent conditions — NODE_ENV must not be
 * 'production', and DEMO_TENANT_ID must be explicitly set — and the failure
 * that matters is it activating when either is absent. The happy path gets one
 * test; the ways it must NOT engage get the rest.
 *
 * The guard is read at module load, so each case re-imports the plugin with a
 * fresh module registry rather than mutating a cached constant.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';

import { createTestAuthPair, type TestAuthPair } from './helpers/make-token.js';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

async function buildWith(
  env: Record<string, string | undefined>,
  auth: TestAuthPair,
): Promise<FastifyInstance> {
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  vi.resetModules();
  const { default: authPlugin } = await import('../plugins/auth.js');

  const app = Fastify({ logger: false });
  await app.register(authPlugin, { verifier: auth.verifier, publicPaths: ['/healthz'] });
  // Must exist for the publicPaths bypass to apply — it matches on the
  // resolved route pattern, so an unregistered path 404s instead. Same trap
  // fixed in #2.
  app.get('/healthz', async () => ({ ok: true }));
  app.get('/me', async (request) => ({
    tenantId: request.tenantId,
    userId: request.userId,
    roles: request.userRoles,
    mfa: request.mfaVerified,
  }));
  await app.ready();
  return app;
}

describe('demo identity — stays off unless both guards are satisfied', () => {
  it('does NOT engage in production even when DEMO_TENANT_ID is set', async () => {
    const auth = await createTestAuthPair();
    const app = await buildWith(
      { NODE_ENV: 'production', DEMO_TENANT_ID: 'tenant-demo' },
      auth,
    );
    // The Fly deployment sets NODE_ENV=production, so a stray DEMO_TENANT_ID
    // there must not open the API.
    const res = await app.inject({ method: 'GET', url: '/me' });
    expect(res.statusCode).toBe(401);
  });

  it('does NOT engage outside production when DEMO_TENANT_ID is unset', async () => {
    const auth = await createTestAuthPair();
    const app = await buildWith(
      { NODE_ENV: 'development', DEMO_TENANT_ID: undefined },
      auth,
    );
    // Fails closed: forgetting the variable gives normal JWT verification.
    const res = await app.inject({ method: 'GET', url: '/me' });
    expect(res.statusCode).toBe(401);
  });

  it('does NOT engage when DEMO_TENANT_ID is empty', async () => {
    const auth = await createTestAuthPair();
    const app = await buildWith({ NODE_ENV: 'development', DEMO_TENANT_ID: '' }, auth);
    const res = await app.inject({ method: 'GET', url: '/me' });
    expect(res.statusCode).toBe(401);
  });

  it('still rejects a tampered token in production with the demo var present', async () => {
    const auth = await createTestAuthPair();
    const app = await buildWith(
      { NODE_ENV: 'production', DEMO_TENANT_ID: 'tenant-demo' },
      auth,
    );
    const res = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { authorization: 'Bearer not.a.jwt' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('demo identity — when both guards are satisfied', () => {
  it('supplies a fixed owner identity with MFA satisfied', async () => {
    const auth = await createTestAuthPair();
    const app = await buildWith(
      { NODE_ENV: 'development', DEMO_TENANT_ID: 'tenant-demo' },
      auth,
    );
    const res = await app.inject({ method: 'GET', url: '/me' });
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.tenantId).toBe('tenant-demo');
    expect(body.roles).toContain('owner');
    // MFA is satisfied so the approval route is reachable in a local demo —
    // that gate is the whole point of slice 2 and cannot be exercised behind
    // an unconfigured Auth0 tenant.
    expect(body.mfa).toBe(true);
  });

  it('scopes to the configured tenant, not an arbitrary one', async () => {
    const auth = await createTestAuthPair();
    const app = await buildWith(
      { NODE_ENV: 'development', DEMO_TENANT_ID: 'tenant-alpha' },
      auth,
    );
    const res = await app.inject({ method: 'GET', url: '/me' });
    expect(res.json().tenantId).toBe('tenant-alpha');
  });

  it('leaves /healthz public as before', async () => {
    const auth = await createTestAuthPair();
    const app = await buildWith(
      { NODE_ENV: 'development', DEMO_TENANT_ID: 'tenant-demo' },
      auth,
    );
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(200);
  });
});
