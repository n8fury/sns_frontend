'use client';

import { useDroppable } from '@dnd-kit/core';
import { PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TaskCard } from '@/components/tasks/TaskCard';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/lib/types';

interface ColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onAddClick: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export function Column({
  status,
  title,
  tasks,
  onAddClick,
  onEditTask,
  onDeleteTask,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-3 rounded-lg border bg-muted/30 p-3 transition-colors',
        isOver && 'border-primary bg-primary/5',
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          {title} <span className="text-muted-foreground">{tasks.length}</span>
        </h2>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Add task to ${title}`}
          onClick={onAddClick}
        >
          <PlusIcon />
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No tasks
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
}
