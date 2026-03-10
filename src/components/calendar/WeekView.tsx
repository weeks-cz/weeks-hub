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
    return events.filter((event) => {
      const start = new Date(event.start_date);
      const end = event.end_date ? new Date(event.end_date) : start;
      return day >= new Date(start.toDateString()) && day <= new Date(end.toDateString());
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
