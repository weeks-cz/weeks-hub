'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { CreateEventModal } from './CreateEventModal';
import { EventDetailModal } from './EventDetailModal';
import { SubscribeModal } from './SubscribeModal';
import { DayDetailModal, type DayTask } from './DayDetailModal';
import { useEvents } from '@/hooks/useEvents';
import { useTasks } from '@/hooks/useTasks';
import { useCamps } from '@/hooks/useCamps';
import { addMonths, subMonths, formatMonthYear, toDateKey } from '@/lib/utils/date';
import { CalendarSkeleton } from '@/components/ui/Skeleton';
import { CAMP_STATUS_CONFIG, type CalendarEvent } from '@/types/database';

type ViewMode = 'month' | 'week';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [dayDetail, setDayDetail] = useState<Date | null>(null);
  const router = useRouter();

  const { events, loading, createEvent, updateEvent, deleteEvent } = useEvents();
  const { tasks } = useTasks();
  const { camps } = useCamps();

  // Convert camps to CalendarEvent-like objects for calendar display
  const campEvents = useMemo<CalendarEvent[]>(() => {
    return camps.map((camp) => ({
      id: `camp-${camp.id}`,
      title: `${camp.title} (${camp.enrolled_count}/${camp.capacity})`,
      description: camp.description,
      event_type: 'camp' as const,
      start_date: `${camp.start_date}T12:00:00`,
      end_date: `${camp.end_date}T12:00:00`,
      all_day: true,
      color: CAMP_STATUS_CONFIG[camp.status]?.color || camp.color,
      created_by: camp.created_by,
      created_at: camp.created_at,
      updated_at: camp.updated_at,
    }));
  }, [camps]);

  const allEvents = useMemo(() => [...events, ...campEvents], [events, campEvents]);

  // Wrap updateEvent to refresh selectedEvent from fresh data
  const handleUpdateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    const result = await updateEvent(eventId, updates);
    // After update, refresh selectedEvent from the latest events
    if (result) {
      setSelectedEvent((prev) => {
        if (!prev || prev.id !== eventId) return prev;
        return { ...prev, ...updates };
      });
    }
    return result;
  }, [updateEvent]);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    if (event.id.startsWith('camp-')) {
      router.push('/camps');
    } else {
      setSelectedEvent(event);
    }
  }, [router]);

  // Get task due dates for calendar
  const taskDueDates = useMemo<DayTask[]>(() => tasks
    .filter((t) => t.due_date && t.status !== 'done')
    .map((t) => ({ date: t.due_date!, title: t.title, id: t.id })), [tasks]);

  const handlePrev = () => setCurrentDate((d) => subMonths(d, 1));
  const handleNext = () => setCurrentDate((d) => addMonths(d, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Klik na den otevře jeho detail. Dřív rovnou zakládal událost, takže se
  // nedalo podívat, co ten den vlastně je.
  const handleDayClick = (date: Date) => setDayDetail(date);

  const handleTaskClick = useCallback((task: DayTask) => {
    router.push(`/board?task=${task.id}`);
  }, [router]);

  const handleCreateFromDay = () => {
    if (!dayDetail) return;
    setSelectedDate(toDateKey(dayDetail));
    setDayDetail(null);
    setCreateModalOpen(true);
  };

  // Obsah otevřeného dne — stejná pravidla filtrování jako v mřížce.
  const dayDetailKey = dayDetail ? toDateKey(dayDetail) : null;
  const dayDetailEvents = dayDetailKey
    ? allEvents.filter((e) => {
        const start = e.start_date.slice(0, 10);
        const end = e.end_date ? e.end_date.slice(0, 10) : start;
        return dayDetailKey >= start && dayDetailKey <= end;
      })
    : [];
  const dayDetailTasks = dayDetailKey
    ? taskDueDates.filter((t) => t.date.slice(0, 10) === dayDetailKey)
    : [];

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

          <Button variant="secondary" size="sm" onClick={() => setSubscribeOpen(true)}>
            <CalendarPlus className="w-4 h-4" />
            <span className="hidden sm:inline ml-1.5">Připojit do kalendáře</span>
          </Button>

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
          events={allEvents}
          taskDueDates={taskDueDates}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
          onTaskClick={handleTaskClick}
        />
      ) : (
        <WeekView
          currentDate={currentDate}
          events={allEvents}
          taskDueDates={taskDueDates}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
          onTaskClick={handleTaskClick}
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
        onUpdate={handleUpdateEvent}
        onDelete={deleteEvent}
      />

      <DayDetailModal
        date={dayDetail}
        events={dayDetailEvents}
        tasks={dayDetailTasks}
        onClose={() => setDayDetail(null)}
        onEventClick={(event) => { setDayDetail(null); handleEventClick(event); }}
        onTaskClick={handleTaskClick}
        onCreateEvent={handleCreateFromDay}
      />

      <SubscribeModal isOpen={subscribeOpen} onClose={() => setSubscribeOpen(false)} />
    </div>
  );
}
