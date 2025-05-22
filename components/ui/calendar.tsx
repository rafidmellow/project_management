'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

// Create a custom type that extends DayPicker props but allows for string dates
export type CalendarProps = Omit<
  React.ComponentProps<typeof DayPicker>,
  'selected' | 'mode' | 'onSelect'
> & {
  selected?: Date | Date[] | null | string | string[];
  onSelect?: (date: Date | undefined) => void;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  selected,
  onSelect,
  ...props
}: CalendarProps) {
  // Convert string dates to Date objects
  const parseSelected = (): Date | Date[] | null | undefined => {
    if (!selected) return selected as null | undefined;

    if (typeof selected === 'string') {
      try {
        return new Date(selected);
      } catch (e) {
        console.error('Invalid date string:', selected);
        return undefined;
      }
    } else if (Array.isArray(selected) && selected.length > 0 && typeof selected[0] === 'string') {
      try {
        return selected.map(date => new Date(date as string));
      } catch (e) {
        console.error('Invalid date string array:', selected);
        return undefined;
      }
    }

    return selected as Date | Date[] | null;
  };

  // Handle day selection
  const handleSelect = (day: Date | undefined) => {
    if (onSelect) {
      onSelect(day);
    }
  };
  // Parse the selected date(s)
  const parsedSelected = parseSelected();

  return (
    <DayPicker
      mode="single"
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100'
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground',
        day_outside:
          'day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      selected={(parsedSelected as Date) || undefined}
      onSelect={handleSelect}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
