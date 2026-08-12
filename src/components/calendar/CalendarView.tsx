'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MonthView } from './MonthView';
import { TimeGridView } from './TimeGridView';
import { CreateEventModal } from './CreateEventModal';
import { EventDetailModal } from './EventDetailModal';
import { SubscribeModal } from './SubscribeModal';
import { DayDetailModal, type DayTask } from './DayDetailModal';
import { usePresun, type PresouvanaPolozka, type CilPresunu } from './usePresun';
import { useEvents } from '@/hooks/useEvents';
import { useTasks } from '@/hooks/useTasks';
import { useCamps } from '@/hooks/useCamps';
import { addMonths, subMonths, addWeeks, subWeeks, addDays, formatMonthYear, formatWeekRange, formatDate, getWeekDays, toDateKey } from '@/lib/utils/date';
import { CalendarSkeleton } from '@/components/ui/Skeleton';
import { CAMP_STATUS_CONFIG, type CalendarEvent } from '@/types/database';

type ViewMode = 'month' | 'week' | 'day';

/** Co se v kalendáři zobrazuje. Ukládá se, aby volba přežila načtení stránky. */
interface Filtry {
  udalosti: boolean;
  tabory: boolean;
  ukoly: boolean;
}

const VYCHOZI_FILTRY: Filtry = { udalosti: true, tabory: true, ukoly: true };
const KLIC_FILTRU = 'weeks-hub:kalendar-filtry';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [dayDetail, setDayDetail] = useState<Date | null>(null);
  // Čte se až v efektu — na serveru localStorage není a rozdíl mezi
  // serverovým a prvním klientským renderem by shodil hydrataci.
  const [filtry, setFiltry] = useState<Filtry>(VYCHOZI_FILTRY);

  useEffect(() => {
    try {
      const ulozene = localStorage.getItem(KLIC_FILTRU);
      if (ulozene) setFiltry({ ...VYCHOZI_FILTRY, ...JSON.parse(ulozene) });
    } catch {
      // Poškozená hodnota v localStorage nesmí shodit kalendář.
    }
  }, []);

  const prepniFiltr = (klic: keyof Filtry) => {
    setFiltry((p) => {
      const dalsi = { ...p, [klic]: !p[klic] };
      try { localStorage.setItem(KLIC_FILTRU, JSON.stringify(dalsi)); } catch {}
      return dalsi;
    });
  };
  const router = useRouter();

  const { events, loading, createEvent, updateEvent, deleteEvent } = useEvents();
  const { tasks, updateTask } = useTasks();
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

  const allEvents = useMemo(() => [
    ...(filtry.udalosti ? events : []),
    ...(filtry.tabory ? campEvents : []),
  ], [events, campEvents, filtry.udalosti, filtry.tabory]);

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
  const taskDueDates = useMemo<DayTask[]>(() => (filtry.ukoly ? tasks : [])
    .filter((t) => t.due_date && t.status !== 'done')
    .map((t) => ({ date: t.due_date!, title: t.title, id: t.id })), [tasks, filtry.ukoly]);

  // Šipky se dřív hýbaly po měsících i v týdenním pohledu, takže z týdne
  // 10.–16. 8. skočily rovnou na 6.–12. 7. a čtyři týdny se přeskočily.
  const posun = (d: Date, smer: 1 | -1) => {
    if (viewMode === 'day') return addDays(d, smer);
    if (viewMode === 'week') return smer > 0 ? addWeeks(d, 1) : subWeeks(d, 1);
    return smer > 0 ? addMonths(d, 1) : subMonths(d, 1);
  };
  const handlePrev = () => setCurrentDate((d) => posun(d, -1));
  const handleNext = () => setCurrentDate((d) => posun(d, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Klik na den otevře jeho detail. Dřív rovnou zakládal událost, takže se
  // nedalo podívat, co ten den vlastně je.
  const handleDayClick = (date: Date) => setDayDetail(date);

  const handleTaskClick = useCallback((task: DayTask) => {
    router.push(`/board?task=${task.id}`);
  }, [router]);

  /**
   * Puštění přesouvané položky. updateEvent/updateTask zapisují na server a
   * teprve pak překreslí z databáze — proto tu není optimistický zápis ani
   * rollback; chybu ohlásí toast z hooku.
   */
  const handlePresun = useCallback(async (p: PresouvanaPolozka, cil: CilPresunu) => {
    if (p.typ === 'ukol') {
      const puvodni = tasks.find((t) => t.id === p.id)?.due_date;
      if (puvodni?.slice(0, 10) === cil.den) return;
      await updateTask(p.id, { due_date: cil.den });
      return;
    }

    const event = events.find((e) => e.id === p.id);
    if (!event) return;

    const start = new Date(event.start_date);
    const [rok, mesic, den] = cil.den.split('-').map(Number);
    const novy = new Date(start);
    novy.setFullYear(rok, mesic - 1, den);
    if (cil.minuty !== null) {
      novy.setHours(Math.floor(cil.minuty / 60), cil.minuty % 60, 0, 0);
    }
    if (novy.getTime() === start.getTime()) return;

    // Délka se zachovává, přesouvá se celá událost, ne jen její začátek.
    const delka = event.end_date ? new Date(event.end_date).getTime() - start.getTime() : 0;
    await handleUpdateEvent(event.id, {
      start_date: novy.toISOString(),
      end_date: event.end_date ? new Date(novy.getTime() + delka).toISOString() : null,
    });
  }, [tasks, events, updateTask, handleUpdateEvent]);

  const { zacni: zacniPresun, stav: presun } = usePresun(handlePresun);

  const handleCreateFromDay = () => {
    if (!dayDetail) return;
    setSelectedDate(toDateKey(dayDetail));
    setSelectedTime('');
    setDayDetail(null);
    setCreateModalOpen(true);
  };

  // Klik do prázdna v týdenní mřížce zakládá událost rovnou na ten čas.
  const handleSlotClick = useCallback((date: Date, cas: string) => {
    setSelectedDate(toDateKey(date));
    setSelectedTime(cas);
    setCreateModalOpen(true);
  }, []);

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
      {/* Toolbar — drží se nahoře, aby při rolování k poslednímu týdnu
          nezmizely šipky, přepínač pohledu a tlačítko nové události. */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 mb-4 py-2 bg-[var(--bg-primary)]">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handlePrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)] min-w-[140px] sm:min-w-[220px] text-center first-letter:uppercase">
            {viewMode === 'day'
              ? formatDate(currentDate)
              : viewMode === 'week'
                ? formatWeekRange(currentDate)
                : formatMonthYear(currentDate)}
          </h2>
          <Button variant="ghost" size="sm" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          {/* Na mobilu bylo "Dnes" schované, takže se ze vzdáleného měsíce
              nedalo vrátit jinak než odklikáním šipek. */}
          <Button variant="ghost" size="sm" onClick={handleToday}>
            Dnes
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-0.5">
            {([
              ['month', 'Měsíc'],
              ['week', 'Týden'],
              ['day', 'Den'],
            ] as const).map(([rezim, popisek]) => (
              <button
                key={rezim}
                onClick={() => setViewMode(rezim)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === rezim
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {popisek}
              </button>
            ))}
          </div>

          <Button variant="secondary" size="sm" onClick={() => setSubscribeOpen(true)}>
            <CalendarPlus className="w-4 h-4" />
            <span className="hidden sm:inline ml-1.5">Připojit do kalendáře</span>
          </Button>

          <Button size="sm" onClick={() => { setSelectedDate(''); setSelectedTime(''); setCreateModalOpen(true); }}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nová událost</span>
          </Button>
        </div>
      </div>

      {/* Filtry — zároveň slouží jako legenda barev */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {([
          ['udalosti', 'Události', '#818CF8'],
          ['tabory', 'Tábory', '#34D399'],
          ['ukoly', 'Úkoly', '#F87171'],
        ] as const).map(([klic, popisek, barva]) => {
          const zapnuto = filtry[klic];
          return (
            <button
              key={klic}
              onClick={() => prepniFiltr(klic)}
              aria-pressed={zapnuto}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                zapnuto
                  ? 'border-[var(--border-default)] text-[var(--text-primary)] bg-[var(--bg-surface)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: zapnuto ? barva : 'transparent', boxShadow: `inset 0 0 0 1px ${barva}` }}
              />
              {popisek}
            </button>
          );
        })}
        <span className="text-[11px] text-[var(--text-muted)] ml-1">
          Úkoly: <span style={{ color: '#F87171' }}>po termínu</span>
          {' · '}<span style={{ color: '#FBBF24' }}>dnes</span>
          {' · '}<span style={{ color: '#A5B4FC' }}>později</span>
        </span>
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
          onPresunStart={zacniPresun}
        />
      ) : (
        <TimeGridView
          days={viewMode === 'week' ? getWeekDays(currentDate) : [currentDate]}
          events={allEvents}
          taskDueDates={taskDueDates}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
          onTaskClick={handleTaskClick}
          onSlotClick={handleSlotClick}
          onPresunStart={zacniPresun}
        />
      )}

      {/* Modals */}
      <CreateEventModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={createEvent}
        defaultDate={selectedDate}
        defaultTime={selectedTime}
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

      {/* Náhled taženého prvku — bez něj není při přesunu vidět, co se veze. */}
      {presun && (
        <div
          className="fixed z-50 pointer-events-none px-2 py-1 rounded-md text-xs font-medium shadow-lg bg-[var(--color-primary)] text-white max-w-[240px] truncate"
          style={{ left: presun.x + 12, top: presun.y + 12 }}
        >
          {presun.polozka.titul}
        </div>
      )}

      <SubscribeModal isOpen={subscribeOpen} onClose={() => setSubscribeOpen(false)} />
    </div>
  );
}
