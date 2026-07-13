'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const YEARS_PER_PAGE = 12;

function yearPageStartFor(year: number) {
  return Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
}

type View = 'day' | 'month' | 'year';

interface DatePickerCalendarProps {
  selected: Date;
  onSelect: (date: Date) => void;
}

// A calendar with drill-down navigation: clicking the "July 2026" caption
// opens a month grid, and clicking that grid's year opens a year grid — so
// jumping to a distant date doesn't mean paging one month at a time.
export function DatePickerCalendar({
  selected,
  onSelect,
}: DatePickerCalendarProps) {
  const [view, setView] = useState<View>('day');
  const [cursor, setCursor] = useState(selected);
  const [yearPageStart, setYearPageStart] = useState(() =>
    yearPageStartFor(selected.getFullYear()),
  );

  // Adjust state during render (same pattern used elsewhere in this app)
  // rather than an effect: resyncs the navigated month/view whenever the
  // selected date changes from outside (e.g. the "Jump to today" button).
  const [lastSelected, setLastSelected] = useState(selected);
  if (selected.getTime() !== lastSelected.getTime()) {
    setLastSelected(selected);
    setCursor(selected);
    setView('day');
  }

  if (view === 'month') {
    const year = cursor.getFullYear();
    return (
      <div className="w-72 p-3">
        <div className="mb-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous year"
            onClick={() => setCursor(new Date(year - 1, cursor.getMonth(), 1))}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <button
            type="button"
            onClick={() => {
              setYearPageStart(yearPageStartFor(year));
              setView('year');
            }}
            className="rounded-md px-2 py-1 text-sm font-medium hover:bg-muted"
          >
            {year}
          </button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next year"
            onClick={() => setCursor(new Date(year + 1, cursor.getMonth(), 1))}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTH_LABELS.map((label, index) => {
            const isSelected =
              selected.getFullYear() === year && selected.getMonth() === index;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setCursor(new Date(year, index, 1));
                  setView('day');
                }}
                className={cn(
                  'rounded-md py-2 text-sm transition-colors hover:bg-muted',
                  isSelected &&
                    'bg-primary font-semibold text-primary-foreground hover:bg-primary',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === 'year') {
    const years = Array.from(
      { length: YEARS_PER_PAGE },
      (_, index) => yearPageStart + index,
    );
    return (
      <div className="w-72 p-3">
        <div className="mb-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous years"
            onClick={() => setYearPageStart((start) => start - YEARS_PER_PAGE)}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="text-sm font-medium">
            {years[0]} - {years[years.length - 1]}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next years"
            onClick={() => setYearPageStart((start) => start + YEARS_PER_PAGE)}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {years.map((year) => {
            const isSelected = selected.getFullYear() === year;
            return (
              <button
                key={year}
                type="button"
                onClick={() => {
                  setCursor(new Date(year, cursor.getMonth(), 1));
                  setView('month');
                }}
                className={cn(
                  'rounded-md py-2 text-sm transition-colors hover:bg-muted',
                  isSelected &&
                    'bg-primary font-semibold text-primary-foreground hover:bg-primary',
                )}
              >
                {year}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Calendar
      mode="single"
      className="w-72"
      month={cursor}
      onMonthChange={setCursor}
      selected={selected}
      onSelect={(date) => date && onSelect(date)}
      components={{
        CaptionLabel: (props) => (
          <button
            type="button"
            onClick={() => setView('month')}
            className="rounded-md px-2 py-1 text-sm font-medium hover:bg-muted"
          >
            {props.children}
          </button>
        ),
      }}
    />
  );
}
