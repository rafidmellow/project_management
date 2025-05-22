'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
  onSelect?: (date: Date | undefined) => void;
  defaultDate?: Date;
  selected?: Date | null | string;
}

export function DatePicker({ onSelect, defaultDate, selected }: DatePickerProps) {
  // Convert string date to Date object if needed
  const parseSelectedDate = (): Date | undefined => {
    if (!selected) return undefined;

    if (typeof selected === 'string') {
      try {
        return new Date(selected);
      } catch (e) {
        console.error('Invalid date string:', selected);
        return undefined;
      }
    }

    return selected;
  };

  const [date, setDate] = React.useState<Date | undefined>(parseSelectedDate() || defaultDate);

  // Update date state when defaultDate or selected prop changes
  React.useEffect(() => {
    setDate(parseSelectedDate() || defaultDate);
  }, [defaultDate, selected]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>Select date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          selected={date}
          onSelect={newDate => {
            setDate(newDate);
            if (onSelect) onSelect(newDate);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
