import { Board } from '@/components/tasks/Board';
import { DateSelector } from '@/components/tasks/DateSelector';

export default function TasksPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h1 className="text-lg font-semibold">Tasks</h1>
        <DateSelector />
      </div>
      <Board />
    </div>
  );
}
