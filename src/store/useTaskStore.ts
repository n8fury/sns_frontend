import { create } from 'zustand';

import { api } from '@/lib/api';
import type { Priority, Task, TaskStatus } from '@/lib/types';

export interface CreateTaskInput {
  title: string;
  due_date: string;
  priority?: Priority;
  status?: TaskStatus;
  tags?: string[];
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: (date: string) => Promise<void>;
  addTask: (input: CreateTaskInput) => Promise<void>;
  updateTask: (id: number, patch: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async (date) => {
    set({ loading: true, error: null });
    try {
      const tasks = await api<Task[]>(`/api/tasks/?date=${date}`);
      set({ tasks, loading: false });
    } catch {
      set({ error: 'Failed to load tasks.', loading: false });
    }
  },

  addTask: async (input) => {
    const task = await api<Task>('/api/tasks/', {
      method: 'POST',
      body: input,
    });
    set({ tasks: [...get().tasks, task] });
  },

  updateTask: async (id, patch) => {
    const previous = get().tasks;
    set({
      tasks: previous.map((task) =>
        task.id === id ? { ...task, ...patch } : task,
      ),
    });
    try {
      const updated = await api<Task>(`/api/tasks/${id}/`, {
        method: 'PATCH',
        body: patch,
      });
      set({
        tasks: get().tasks.map((task) => (task.id === id ? updated : task)),
      });
    } catch (err) {
      set({ tasks: previous });
      throw err;
    }
  },

  deleteTask: async (id) => {
    const previous = get().tasks;
    set({ tasks: previous.filter((task) => task.id !== id) });
    try {
      await api(`/api/tasks/${id}/`, { method: 'DELETE' });
    } catch (err) {
      set({ tasks: previous });
      throw err;
    }
  },
}));
