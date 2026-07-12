'use client';

import { useDraggable } from '@dnd-kit/core';
import { MoreVerticalIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Priority, Task } from '@/lib/types';

const PRIORITY_CLASSES: Record<Priority, string> = {
  low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  high: 'bg-destructive/10 text-destructive',
};

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  dragDisabled?: boolean;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  dragDisabled,
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
      disabled: dragDisabled,
    });

  function handleDelete() {
    if (window.confirm(`Delete "${task.title}"?`)) {
      onDelete(task);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      {...attributes}
      {...listeners}
      className={cn(isDragging && 'opacity-40')}
    >
      <Card size="sm" className="cursor-grab active:cursor-grabbing">
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium">{task.title}</p>
            <div className="flex items-center gap-1">
              <Badge className={PRIORITY_CLASSES[task.priority]}>
                {task.priority}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Task actions"
                  >
                    <MoreVerticalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">{task.due_date}</p>
        </CardContent>
      </Card>
    </div>
  );
}
