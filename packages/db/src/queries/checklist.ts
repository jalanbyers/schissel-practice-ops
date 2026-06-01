import { eq, and } from 'drizzle-orm';
import { checklistTasks } from '../schema/checklist.js';
import { NotFoundError } from '../errors.js';
import type { DrizzleDb } from '../client.js';
import type { NewChecklistTask } from '../schema/checklist.js';

export async function getChecklistByTenant(db: DrizzleDb, tenantId: string) {
  return db.select().from(checklistTasks).where(eq(checklistTasks.tenantId, tenantId));
}

export async function getChecklistTaskById(db: DrizzleDb, tenantId: string, taskId: string) {
  const rows = await db
    .select()
    .from(checklistTasks)
    .where(and(eq(checklistTasks.tenantId, tenantId), eq(checklistTasks.id, taskId)));
  if (rows.length === 0) throw new NotFoundError('Checklist task not found');
  return rows[0]!;
}

export async function insertChecklistTask(
  db: DrizzleDb,
  tenantId: string,
  data: Omit<NewChecklistTask, 'tenantId' | 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const rows = await db
    .insert(checklistTasks)
    .values({ ...data, tenantId })
    .returning({ id: checklistTasks.id });
  return rows[0]!.id;
}

export async function updateChecklistTask(
  db: DrizzleDb,
  tenantId: string,
  taskId: string,
  data: Partial<Omit<NewChecklistTask, 'tenantId' | 'id' | 'createdAt'>>,
) {
  const rows = await db
    .update(checklistTasks)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(checklistTasks.tenantId, tenantId), eq(checklistTasks.id, taskId)))
    .returning({ id: checklistTasks.id });
  if (rows.length === 0) throw new NotFoundError('Checklist task not found');
  return rows[0]!;
}

export async function deleteChecklistTask(db: DrizzleDb, tenantId: string, taskId: string) {
  const rows = await db
    .delete(checklistTasks)
    .where(and(eq(checklistTasks.tenantId, tenantId), eq(checklistTasks.id, taskId)))
    .returning({ id: checklistTasks.id });
  if (rows.length === 0) throw new NotFoundError('Checklist task not found');
}
