import Fastify from 'fastify';
import { config } from './config.js';
import authPlugin, { makeAuth0Verifier } from './plugins/auth.js';
import { licensesRoutes } from './routes/licenses.js';
import { createDb } from '@schissel/db';

const fastify = Fastify({ logger: true });

const db = createDb(config.database.url);

await fastify.register(authPlugin, {
  verifier: makeAuth0Verifier(config.auth0.domain, config.auth0.audience),
  publicPaths: ['/healthz'],
});

fastify.get('/healthz', async () => ({ ok: true }));

await fastify.register(licensesRoutes, { prefix: '/v1/licenses', db });

fastify.listen({ port: config.port, host: '0.0.0.0' }, (err) => {
  if (err) { fastify.log.error(err); process.exit(1); }
});
