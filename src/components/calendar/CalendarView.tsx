'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { CreateEventModal } from './CreateEventModal';
import { EventDetailModal } from './EventDetailModal';
import { useEvents } from '@/hooks/useEvents';
import { useTasks } from '@/hooks/useTasks';
import { addMonths, subMonths, formatMonthYear } from '@/lib/utils/date';
import { CalendarSkeleton } from '@/components/ui/Skeleton';
import type { CalendarEvent } from '@/types/database';

type ViewMode = 'month' | 'week';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const { events, loading, createEvent, updateEvent, deleteEvent } = useEvents();
  const { tasks } = useTasks();

  // Get task due dates for calendar
  const taskDueDates = tasks
    .filter((t) => t.due_date && t.status !== 'done')
    .map((t) => ({ date: t.due_date!, title: t.title, id: t.id }));

  const handlePrev = () => setCurrentDate((d) => subMonths(d, 1));
  const handleNext = () => setCurrentDate((d) => addMonths(d, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleDayClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    setCreateModalOpen(true);
  };

  if (loading) return <CalendarSkeleton />;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handlePrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)] min-w-[140px] sm:min-w-[200px] text-center capitalize">
            {formatMonthYear(currentDate)}
          </h2>
          <Button variant="ghost" size="sm" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleToday} className="hidden sm:inline-flex">
            Dnes
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-0.5">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Měsíc
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Týden
            </button>
          </div>

          <Button size="sm" onClick={() => { setSelectedDate(''); setCreateModalOpen(true); }}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nová událost</span>
          </Button>
        </div>
      </div>

      {/* Calendar view */}
      {viewMode === 'month' ? (
        <MonthView
          currentDate={currentDate}
          events={events}
          taskDueDates={taskDueDates}
          onEventClick={setSelectedEvent}
          onDayClick={handleDayClick}
        />
      ) : (
        <WeekView
          currentDate={currentDate}
          events={events}
          onEventClick={setSelectedEvent}
        />
      )}

      {/* Modals */}
      <CreateEventModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={createEvent}
        defaultDate={selectedDate}
      />

      <EventDetailModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onUpdate={updateEvent}
        onDelete={deleteEvent}
      />
    </div>
  );
}
