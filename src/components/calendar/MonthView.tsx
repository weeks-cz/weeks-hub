'use client';

import { cn } from '@/lib/utils/cn';
import { EventCard } from './EventCard';
import { getDaysInMonthGrid, WEEKDAY_NAMES, isSameMonth, isToday, toDateKey } from '@/lib/utils/date';
import type { CalendarEvent } from '@/types/database';
import type { DayTask } from './DayDetailModal';
import { taskChipStyle, dalsiLabel } from './taskChip';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  taskDueDates: DayTask[];
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
  onTaskClick: (task: DayTask) => void;
}

export function MonthView({ currentDate, events, taskDueDates, onEventClick, onDayClick, onTaskClick }: MonthViewProps) {
  const days = getDaysInMonthGrid(currentDate);

  const getEventsForDay = (day: Date) => {
    const dayStr = toDateKey(day);
    return events.filter((event) => {
      const startStr = event.start_date.slice(0, 10);
      const endStr = event.end_date ? event.end_date.slice(0, 10) : startStr;
      return dayStr >= startStr && dayStr <= endStr;
    });
  };

  // due_date je DATE ('YYYY-MM-DD'); porovnává se jako řetězec, aby se datum
  // nikdy neposunulo přes new Date() a časové pásmo.
  const getTaskDueDatesForDay = (day: Date) => {
    const dayStr = toDateKey(day);
    return taskDueDates.filter((t) => t.date.slice(0, 10) === dayStr);
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
          // Vykresluje se až 3 události + 2 úkoly; původní počet "+N dalších"
          // počítal, jako by se vešly jen tři položky celkem.
          const skryto =
            Math.max(0, dayEvents.length - 3) + Math.max(0, dayTasks.length - 2);

          return (
            <div
              key={idx}
              onClick={() => onDayClick(day)}
              className={cn(
                'min-h-[80px] sm:min-h-[100px] p-1 sm:p-1.5 border-r border-b border-[var(--border-default)] cursor-pointer hover:bg-[var(--bg-surface)] transition-colors',
                // Dřív se ztlumila celá buňka včetně štítků, takže úkoly
                // v přesahujících dnech byly skoro nečitelné. Ztlumí se
                // jen číslo dne, obsah zůstává čitelný.
                !isCurrentMonth && 'bg-[var(--bg-surface)]/30'
              )}
            >
              <span
                className={cn(
                  'inline-flex items-center justify-center w-7 h-7 text-sm rounded-full mb-1',
                  isCurrentDay
                    ? 'bg-[var(--color-primary)] text-white font-semibold'
                    : isCurrentMonth
                      ? 'text-[var(--text-secondary)]'
                      : 'text-[var(--text-muted)] opacity-60'
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
                  <button
                    key={task.id}
                    // Bez stopPropagation by klik probublal na buňku dne a místo
                    // úkolu by se otevřel detail dne.
                    onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                    className="w-full text-left px-1.5 py-0.5 rounded text-xs font-medium truncate hover:opacity-80 transition-opacity"
                    style={taskChipStyle(task.date)}
                    title={task.title}
                  >
                    📋 {task.title}
                  </button>
                ))}
                {skryto > 0 && (
                  <span className="text-xs text-[var(--text-muted)] px-1">
                    {dalsiLabel(skryto)}
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
