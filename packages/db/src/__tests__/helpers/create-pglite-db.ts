/**
 * In-process Postgres test backend using PGlite.
 *
 * Runs the full tenant-isolation spec without Docker.
 * PGlite is based on Postgres 16, so gen_random_uuid() is available
 * as a built-in (no pgcrypto extension needed).
 *
 * In CI, testcontainers/postgresql is used instead (see tenant-isolation.test.ts).
 * Locally, this helper is the default when Docker is not available.
 */
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '../../schema/index.js';
import { setupSchema } from './setup-schema.js';

export async function createPgliteDb(): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
  stop: () => Promise<void>;
}> {
  const pg = new PGlite();
  const db = drizzle(pg, { schema });
  await setupSchema(db as any);
  return {
    db,
    stop: async () => {
      try { await pg.close(); } catch { /* already closed */ }
    },
  };
}
