// Step 2 — auth plugin + route handlers wired here.
// Placeholder until auth (Auth0 JWT, RBAC, MFA) is implemented in step 2.
import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

fastify.get('/healthz', async () => ({ ok: true }));

fastify.listen({ port: 3001, host: '0.0.0.0' }, (err) => {
  if (err) { fastify.log.error(err); process.exit(1); }
});
