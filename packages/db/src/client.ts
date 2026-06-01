import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index.js';

export type DrizzleDb = ReturnType<typeof createDb>;

export function createDb(connectionString: string): ReturnType<typeof drizzle<typeof schema>> {
  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}
