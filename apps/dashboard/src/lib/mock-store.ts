import type { ChecklistTask } from './types';

const KEY = 'schissel_tasks';

// Lazy-load from localStorage on first access (runs client-side only).
let _tasks: ChecklistTask[] | null = null;

function get(): ChecklistTask[] {
  if (_tasks === null) {
    try { _tasks = JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
    catch { _tasks = []; }
  }
  return _tasks!;
}

function persist(tasks: ChecklistTask[]) {
  _tasks = tasks;
  localStorage.setItem(KEY, JSON.stringify(tasks));
}

export const mockTaskStore = {
  getAll: () => get(),
  add(t: ChecklistTask)                             { persist([...get(), t]); },
  update(id: string, patch: Partial<ChecklistTask>) { persist(get().map(t => t.id === id ? { ...t, ...patch } : t)); },
  remove(id: string)                                { persist(get().filter(t => t.id !== id)); },
};
