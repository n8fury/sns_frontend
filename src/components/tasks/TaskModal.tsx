'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Priority, Task, TaskStatus } from '@/lib/types';
import { useDateStore } from '@/store/useDateStore';
import { useTaskStore } from '@/store/useTaskStore';

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  status?: TaskStatus; // used when mode === 'add'
  task?: Task; // used when mode === 'edit'
}

function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function TaskModal({
  open,
  onOpenChange,
  mode,
  status,
  task,
}: TaskModalProps) {
  const selectedDate = useDateStore((state) => state.selectedDate);
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  // Adjust state during render (React's documented pattern) rather than
  // setState-in-effect: fires exactly on the closed->open transition, not
  // on every render while open (the old effect's deps included mode/task/
  // selectedDate, so it could wipe in-progress edits if those ever changed
  // while the dialog was still open).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setError(null);
      if (mode === 'edit' && task) {
        setTitle(task.title);
        setPriority(task.priority);
        setDueDate(task.due_date);
        setTagsInput(task.tags.join(', '));
      } else {
        setTitle('');
        setPriority('medium');
        setDueDate(selectedDate);
        setTagsInput('');
      }
    }
  }

  const isValid = title.trim().length > 0 && dueDate.trim().length > 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      const tags = parseTags(tagsInput);
      if (mode === 'add') {
        await addTask({
          title: title.trim(),
          priority,
          status,
          due_date: dueDate,
          tags,
        });
      } else if (task) {
        await updateTask(task.id, {
          title: title.trim(),
          priority,
          due_date: dueDate,
          tags,
        });
      }
      onOpenChange(false);
      toast.success(mode === 'add' ? 'Task created' : 'Task updated');
    } catch {
      setError('Failed to save task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add task' : 'Edit task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-priority">Priority</Label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as Priority)}
            >
              <SelectTrigger id="task-priority" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-due-date">Due date</Label>
            <Input
              id="task-due-date"
              type="date"
              required
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-tags">Tags</Label>
            <Input
              id="task-tags"
              placeholder="comma, separated, tags"
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={!isValid || submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
