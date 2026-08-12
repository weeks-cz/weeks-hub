'use client';

import { cn } from '@/lib/utils/cn';
import { EventCard } from './EventCard';
import { getWeekDays, isToday, format, toDateKey } from '@/lib/utils/date';
import type { CalendarEvent } from '@/types/database';
import type { DayTask } from './DayDetailModal';
import { taskChipStyle } from './taskChip';
import { cs } from 'date-fns/locale';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  taskDueDates: DayTask[];
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
  onTaskClick: (task: DayTask) => void;
}

export function WeekView({
  currentDate,
  events,
  taskDueDates,
  onEventClick,
  onDayClick,
  onTaskClick,
}: WeekViewProps) {
  const days = getWeekDays(currentDate);

  const getEventsForDay = (day: Date) => {
    const dayStr = toDateKey(day);
    return events.filter((event) => {
      const startStr = event.start_date.slice(0, 10);
      const endStr = event.end_date ? event.end_date.slice(0, 10) : startStr;
      return dayStr >= startStr && dayStr <= endStr;
    });
  };

  const getTasksForDay = (day: Date) => {
    const dayStr = toDateKey(day);
    return taskDueDates.filter((t) => t.date.slice(0, 10) === dayStr);
  };

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="grid grid-cols-7 gap-2 min-w-[700px] sm:min-w-0">
      {days.map((day, idx) => {
        const dayEvents = getEventsForDay(day);
        const dayTasks = getTasksForDay(day);
        const isCurrent = isToday(day);

        return (
          <div key={idx} className="min-h-[200px]">
            <button
              onClick={() => onDayClick(day)}
              className={cn(
                'w-full text-center py-2 rounded-t-xl transition-colors hover:bg-[var(--bg-surface-hover)]',
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
            </button>

            <div className="space-y-1.5 mt-2">
              {dayEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => onEventClick(event)}
                />
              ))}
              {/* Úkoly s termínem byly dřív vidět jen v měsíčním pohledu. */}
              {dayTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium truncate hover:opacity-80 transition-opacity"
                  style={taskChipStyle(task.date)}
                  title={task.title}
                >
                  📋 {task.title}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
