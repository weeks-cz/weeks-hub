'use client';

import { cn } from '@/lib/utils/cn';
import { EventCard } from './EventCard';
import { getDaysInMonthGrid, WEEKDAY_NAMES, isSameDay, isSameMonth, isToday } from '@/lib/utils/date';
import type { CalendarEvent } from '@/types/database';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  taskDueDates: { date: string; title: string; id: string }[];
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
}

export function MonthView({ currentDate, events, taskDueDates, onEventClick, onDayClick }: MonthViewProps) {
  const days = getDaysInMonthGrid(currentDate);

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const start = new Date(event.start_date);
      const end = event.end_date ? new Date(event.end_date) : start;
      return day >= new Date(start.toDateString()) && day <= new Date(end.toDateString());
    });
  };

  const getTaskDueDatesForDay = (day: Date) => {
    return taskDueDates.filter((t) => isSameDay(new Date(t.date), day));
  };

  return (
    <div>
      {/* Weekday header */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_NAMES.map((name) => (
          <div key={name} className="text-center text-xs font-medium text-[var(--text-muted)] py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 border-t border-l border-[var(--border-default)]">
        {days.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const dayTasks = getTaskDueDatesForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={idx}
              onClick={() => onDayClick(day)}
              className={cn(
                'min-h-[80px] sm:min-h-[100px] p-1 sm:p-1.5 border-r border-b border-[var(--border-default)] cursor-pointer hover:bg-[var(--bg-surface)] transition-colors',
                !isCurrentMonth && 'opacity-40'
              )}
            >
              <span
                className={cn(
                  'inline-flex items-center justify-center w-7 h-7 text-sm rounded-full mb-1',
                  isCurrentDay
                    ? 'bg-[var(--color-primary)] text-white font-semibold'
                    : 'text-[var(--text-secondary)]'
                )}
              >
                {day.getDate()}
              </span>

              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    compact
                    onClick={() => { onEventClick(event); }}
                  />
                ))}
                {dayTasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className="px-1.5 py-0.5 rounded text-xs font-medium truncate"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}
                  >
                    📋 {task.title}
                  </div>
                ))}
                {(dayEvents.length + dayTasks.length) > 3 && (
                  <span className="text-xs text-[var(--text-muted)] px-1">
                    +{dayEvents.length + dayTasks.length - 3} dalších
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
