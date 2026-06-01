import { eq, and } from 'drizzle-orm';
import { engagements } from '../schema/engagements.js';
import { NotFoundError } from '../errors.js';
import type { DrizzleDb } from '../client.js';
import type { NewEngagement } from '../schema/engagements.js';

export async function getEngagementsByTenant(db: DrizzleDb, tenantId: string) {
  return db.select().from(engagements).where(eq(engagements.tenantId, tenantId));
}

export async function getEngagementById(db: DrizzleDb, tenantId: string, engagementId: string) {
  const rows = await db
    .select()
    .from(engagements)
    .where(and(eq(engagements.tenantId, tenantId), eq(engagements.id, engagementId)));
  if (rows.length === 0) throw new NotFoundError('Engagement not found');
  return rows[0]!;
}

export async function insertEngagement(
  db: DrizzleDb,
  tenantId: string,
  data: Omit<NewEngagement, 'tenantId' | 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const rows = await db
    .insert(engagements)
    .values({ ...data, tenantId })
    .returning({ id: engagements.id });
  return rows[0]!.id;
}

export async function updateEngagement(
  db: DrizzleDb,
  tenantId: string,
  engagementId: string,
  data: Partial<Omit<NewEngagement, 'tenantId' | 'id' | 'createdAt'>>,
) {
  const rows = await db
    .update(engagements)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(engagements.tenantId, tenantId), eq(engagements.id, engagementId)))
    .returning({ id: engagements.id });
  if (rows.length === 0) throw new NotFoundError('Engagement not found');
  return rows[0]!;
}

export async function deleteEngagement(db: DrizzleDb, tenantId: string, engagementId: string) {
  const rows = await db
    .delete(engagements)
    .where(and(eq(engagements.tenantId, tenantId), eq(engagements.id, engagementId)))
    .returning({ id: engagements.id });
  if (rows.length === 0) throw new NotFoundError('Engagement not found');
}
