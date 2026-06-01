import { eq } from 'drizzle-orm';
import { settings } from '../schema/settings.js';
import type { DrizzleDb } from '../client.js';
import type { NewSettings } from '../schema/settings.js';

export async function getSettings(db: DrizzleDb, tenantId: string) {
  const rows = await db.select().from(settings).where(eq(settings.tenantId, tenantId));
  return rows[0] ?? null;
}

export async function upsertSettings(
  db: DrizzleDb,
  tenantId: string,
  data: Partial<Omit<NewSettings, 'tenantId'>>,
) {
  const rows = await db
    .insert(settings)
    .values({ ...data, tenantId })
    .onConflictDoUpdate({
      target: settings.tenantId,
      set: { ...data, updatedAt: new Date() },
    })
    .returning();
  return rows[0]!;
}
