import { PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TaskCard } from '@/components/tasks/TaskCard';
import type { Task } from '@/lib/types';

interface ColumnProps {
  title: string;
  tasks: Task[];
  onAddClick: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export function Column({
  title,
  tasks,
  onAddClick,
  onEditTask,
  onDeleteTask,
}: ColumnProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-lg border bg-muted/30 p-3">
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
