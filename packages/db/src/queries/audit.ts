import { desc, eq } from 'drizzle-orm';
import { auditLog } from '../schema/audit.js';
import type { DrizzleDb } from '../client.js';
import type { NewAuditLogRow } from '../schema/audit.js';

export async function insertAuditEvent(
  db: DrizzleDb,
  tenantId: string,
  event: Omit<NewAuditLogRow, 'id' | 'tenantId' | 'ts' | 'createdAt'>,
): Promise<string> {
  const rows = await db
    .insert(auditLog)
    .values({ ...event, tenantId })
    .returning({ id: auditLog.id });
  return rows[0]!.id;
}

export async function getAuditLogByTenant(
  db: DrizzleDb,
  tenantId: string,
  limit = 100,
) {
  return db
    .select()
    .from(auditLog)
    .where(eq(auditLog.tenantId, tenantId))
    .orderBy(desc(auditLog.ts))
    .limit(limit);
}
