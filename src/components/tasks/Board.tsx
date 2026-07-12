'use client';

import { useEffect } from 'react';

import { Column } from '@/components/tasks/Column';
import type { TaskStatus } from '@/lib/types';
import { useDateStore } from '@/store/useDateStore';
import { useTaskStore } from '@/store/useTaskStore';

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'To Do' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
];

export function Board() {
  const selectedDate = useDateStore((state) => state.selectedDate);
  const tasks = useTaskStore((state) => state.tasks);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);

  useEffect(() => {
    fetchTasks(selectedDate);
  }, [selectedDate, fetchTasks]);

  return (
    <div className="flex flex-1 gap-3 p-4">
      {COLUMNS.map(({ status, title }) => (
        <Column
          key={status}
          title={title}
          tasks={tasks.filter((task) => task.status === status)}
        />
      ))}
    </div>
  );
}
