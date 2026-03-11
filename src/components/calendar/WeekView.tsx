'use client';

import { cn } from '@/lib/utils/cn';
import { EventCard } from './EventCard';
import { getWeekDays, isToday, format } from '@/lib/utils/date';
import type { CalendarEvent } from '@/types/database';
import { cs } from 'date-fns/locale';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function WeekView({ currentDate, events, onEventClick }: WeekViewProps) {
  const days = getWeekDays(currentDate);

  const getEventsForDay = (day: Date) => {
    const dayStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    return events.filter((event) => {
      const startStr = event.start_date.slice(0, 10);
      const endStr = event.end_date ? event.end_date.slice(0, 10) : startStr;
      return dayStr >= startStr && dayStr <= endStr;
    });
  };

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="grid grid-cols-7 gap-2 min-w-[700px] sm:min-w-0">
      {days.map((day, idx) => {
        const dayEvents = getEventsForDay(day);
        const isCurrent = isToday(day);

        return (
          <div key={idx} className="min-h-[200px]">
            <div
              className={cn(
                'text-center py-2 rounded-t-xl',
                isCurrent ? 'bg-[var(--color-primary)]/10' : 'bg-[var(--bg-surface)]'
              )}
            >
              <div className="text-xs text-[var(--text-muted)] uppercase">
                {format(day, 'EEE', { locale: cs })}
              </div>
              <div
                className={cn(
                  'text-lg font-semibold',
                  isCurrent ? 'text-[var(--color-primary)]' : 'text-[var(--text-primary)]'
                )}
              >
                {day.getDate()}
              </div>
            </div>

            <div className="space-y-1.5 mt-2">
              {dayEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => onEventClick(event)}
                />
              ))}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
