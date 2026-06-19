import type { ChecklistTask } from './types';

// Module-level mutable store for mock mode. Survives React re-renders;
// resets on full page reload (intentional for demo/dev use).
let _tasks: ChecklistTask[] = [];

export const mockTaskStore = {
  getAll: () => _tasks,
  add(t: ChecklistTask)                          { _tasks = [..._tasks, t]; },
  update(id: string, patch: Partial<ChecklistTask>) {
    _tasks = _tasks.map(t => t.id === id ? { ...t, ...patch } : t);
  },
  remove(id: string)                             { _tasks = _tasks.filter(t => t.id !== id); },
};
