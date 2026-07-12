'use client';

import { useEffect, useState } from 'react';

import { Column } from '@/components/tasks/Column';
import { TaskModal } from '@/components/tasks/TaskModal';
import type { Task, TaskStatus } from '@/lib/types';
import { useDateStore } from '@/store/useDateStore';
import { useTaskStore } from '@/store/useTaskStore';

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'To Do' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
];

type ModalState =
  | { mode: 'add'; status: TaskStatus }
  | { mode: 'edit'; task: Task }
  | null;

export function Board() {
  const selectedDate = useDateStore((state) => state.selectedDate);
  const tasks = useTaskStore((state) => state.tasks);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);

  const [modal, setModal] = useState<ModalState>(null);

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
          onAddClick={() => setModal({ mode: 'add', status })}
          onEditTask={(task) => setModal({ mode: 'edit', task })}
        />
      ))}

      <TaskModal
        open={modal !== null}
        onOpenChange={(open) => !open && setModal(null)}
        mode={modal?.mode ?? 'add'}
        status={modal?.mode === 'add' ? modal.status : undefined}
        task={modal?.mode === 'edit' ? modal.task : undefined}
      />
    </div>
  );
}
