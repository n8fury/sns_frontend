'use client';

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { addDays, fromIsoDate, toIsoDate } from '@/lib/date';
import { useDateStore } from '@/store/useDateStore';

export function DateSelector() {
  const selectedDate = useDateStore((state) => state.selectedDate);
  const setSelectedDate = useDateStore((state) => state.setSelectedDate);

  const displayDate = fromIsoDate(selectedDate).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous day"
        onClick={() => setSelectedDate(addDays(selectedDate, -1))}
      >
        <ChevronLeftIcon />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">{displayDate}</Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={fromIsoDate(selectedDate)}
            onSelect={(date) => date && setSelectedDate(toIsoDate(date))}
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        aria-label="Next day"
        onClick={() => setSelectedDate(addDays(selectedDate, 1))}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  );
}
