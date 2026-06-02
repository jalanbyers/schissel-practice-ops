import Fastify from 'fastify';
import { config } from './config.js';
import authPlugin, { makeAuth0Verifier } from './plugins/auth.js';
import { licensesRoutes }    from './routes/licenses.js';
import { payersRoutes }      from './routes/payers.js';
import { engagementsRoutes } from './routes/engagements.js';
import { financesRoutes }    from './routes/finances.js';
import { complianceRoutes }  from './routes/compliance.js';
import { settingsRoutes }    from './routes/settings.js';
import { createDb } from '@schissel/db';

const fastify = Fastify({ logger: true });
const db = createDb(config.database.url);

await fastify.register(authPlugin, {
  verifier: makeAuth0Verifier(config.auth0.domain, config.auth0.audience),
  publicPaths: ['/healthz'],
});

fastify.get('/healthz', async () => ({ ok: true }));

await fastify.register(licensesRoutes,    { prefix: '/v1/licenses',    db });
await fastify.register(payersRoutes,      { prefix: '/v1/payers',      db });
await fastify.register(engagementsRoutes, { prefix: '/v1/engagements', db });
await fastify.register(financesRoutes,    { prefix: '/v1/finances',    db });
await fastify.register(complianceRoutes,  { prefix: '/v1/compliance',  db });
await fastify.register(settingsRoutes,    { prefix: '/v1/settings',    db });

fastify.listen({ port: config.port, host: '0.0.0.0' }, (err) => {
  if (err) { fastify.log.error(err); process.exit(1); }
});
