'use client';

import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DatePickerCalendar } from '@/components/DatePickerCalendar';
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
    <div className="flex items-center gap-0.5 rounded-full border bg-background p-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Previous day"
        className="rounded-full"
        onClick={() => setSelectedDate(addDays(selectedDate, -1))}
      >
        <ChevronLeftIcon />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-full px-3 font-medium"
          >
            <CalendarIcon className="size-4 text-muted-foreground" />
            {displayDate}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <DatePickerCalendar
            selected={fromIsoDate(selectedDate)}
            onSelect={(date) => setSelectedDate(toIsoDate(date))}
          />
          <div className="flex justify-center border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(toIsoDate(new Date()))}
            >
              Jump to today
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Next day"
        className="rounded-full"
        onClick={() => setSelectedDate(addDays(selectedDate, 1))}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  );
}
