'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Column } from '@/components/tasks/Column';
import { TaskCard } from '@/components/tasks/TaskCard';
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
  const loading = useTaskStore((state) => state.loading);
  const error = useTaskStore((state) => state.error);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);

  const [modal, setModal] = useState<ModalState>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  useEffect(() => {
    fetchTasks(selectedDate);
  }, [selectedDate, fetchTasks]);

  function handleDragStart(event: DragStartEvent) {
    setDragError(null);
    setActiveTask((event.active.data.current?.task as Task) ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const task = active.data.current?.task as Task | undefined;
    const newStatus = over.id as TaskStatus;
    if (!task || task.status === newStatus) return;

    try {
      await updateTask(task.id, { status: newStatus });
    } catch {
      setDragError('Failed to move task. Please try again.');
    }
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
        <Button variant="outline" onClick={() => fetchTasks(selectedDate)}>
          Retry
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 gap-3 p-4">
        {COLUMNS.map(({ status, title }) => (
          <div
            key={status}
            aria-label={`Loading ${title}`}
            className="flex min-w-0 flex-1 flex-col gap-3 rounded-lg border bg-muted/30 p-3"
          >
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-2 p-4">
      {dragError && (
        <p role="alert" className="text-sm text-destructive">
          {dragError}
        </p>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-3">
          {COLUMNS.map(({ status, title }) => (
            <Column
              key={status}
              status={status}
              title={title}
              tasks={tasks.filter((task) => task.status === status)}
              onAddClick={() => setModal({ mode: 'add', status })}
              onEditTask={(task) => setModal({ mode: 'edit', task })}
              onDeleteTask={(task) => {
                deleteTask(task.id).catch(() => {
                  // rollback already applied inside the store
                });
              }}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              onEdit={() => {}}
              onDelete={() => {}}
              dragDisabled
            />
          ) : null}
        </DragOverlay>
      </DndContext>

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
