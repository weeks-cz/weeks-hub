'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { isToday, format, toDateKey, formatTime } from '@/lib/utils/date';
import { rozvrhniPrekryvy, type Interval } from '@/lib/utils/overlap';
import { EVENT_TYPE_CONFIG, type CalendarEvent } from '@/types/database';
import type { DayTask } from './DayDetailModal';
import { taskChipStyle } from './taskChip';
import { cs } from 'date-fns/locale';

const HODINA_PX = 48;
const DEN_PX = 24 * HODINA_PX;
/** Kam se mřížka odroluje, když v týdnu nic brzkého není. */
const VYCHOZI_HODINA = 7;

interface TimeGridViewProps {
  /** Dny, které se vykreslí jako sloupce. Týden má sedm, denní pohled jeden. */
  days: Date[];
  events: CalendarEvent[];
  taskDueDates: DayTask[];
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
  onTaskClick: (task: DayTask) => void;
  /** Klik do prázdna v mřížce — den a čas, kde se má založit událost. */
  onSlotClick: (date: Date, cas: string) => void;
}

interface UmistenaUdalost extends Interval {
  event: CalendarEvent;
}

function minutyOdPulnoci(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export function TimeGridView({
  days,
  events,
  taskDueDates,
  onEventClick,
  onDayClick,
  onTaskClick,
  onSlotClick,
}: TimeGridViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Tailwind hleda tridy staticky ve zdrojaku, takze pocet sloupcu nejde
  // slozit z promenne — musi jit inline stylem.
  const mrizka = { gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` };
  const [ted, setTed] = useState(() => new Date());

  // Čára "teď" se posouvá po minutě; bez toho by po pár hodinách lhala.
  useEffect(() => {
    const id = setInterval(() => setTed(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const celodenni = useMemo(() => events.filter((e) => e.all_day), [events]);
  const casovane = useMemo(() => events.filter((e) => !e.all_day), [events]);

  /** Události daného dne rozdělené do sloupců podle překryvů. */
  const rozvrhDne = useMemo(() => {
    const mapa = new Map<string, { polozka: UmistenaUdalost; sloupec: number; sloupcu: number }[]>();

    for (const day of days) {
      const klic = toDateKey(day);
      const dneska: UmistenaUdalost[] = [];

      for (const event of casovane) {
        if (event.start_date.slice(0, 10) !== klic) continue;
        const od = minutyOdPulnoci(event.start_date);
        // Bez konce počítáme hodinu, ať má událost vůbec výšku.
        const doMin = event.end_date ? minutyOdPulnoci(event.end_date) : od + 60;
        dneska.push({ event, od, do: Math.max(od + 15, Math.min(doMin, 24 * 60)) });
      }

      const rozvrh = rozvrhniPrekryvy(dneska);
      mapa.set(
        klic,
        dneska.map((p) => ({
          polozka: p,
          sloupec: rozvrh.get(p)?.sloupec ?? 0,
          sloupcu: rozvrh.get(p)?.sloupcu ?? 1,
        })),
      );
    }
    return mapa;
  }, [days, casovane]);

  // Odrolovat na první událost týdne, ať se uživatel nekouká na prázdnou noc.
  useEffect(() => {
    if (!scrollRef.current) return;
    let nejdriv = VYCHOZI_HODINA * 60;
    for (const seznam of rozvrhDne.values()) {
      for (const { polozka } of seznam) nejdriv = Math.min(nejdriv, polozka.od);
    }
    scrollRef.current.scrollTop = Math.max(0, (nejdriv / 60) * HODINA_PX - HODINA_PX / 2);
  }, [rozvrhDne]);

  const celodenniProDen = (day: Date) => {
    const klic = toDateKey(day);
    return celodenni.filter((e) => {
      const od = e.start_date.slice(0, 10);
      const doDne = e.end_date ? e.end_date.slice(0, 10) : od;
      return klic >= od && klic <= doDne;
    });
  };

  const ukolyProDen = (day: Date) =>
    taskDueDates.filter((t) => t.date.slice(0, 10) === toDateKey(day));

  const handleSlotClick = (day: Date, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    // Zaokrouhlení na půlhodiny — přesnost na minutu by nikdo netrefil.
    const minuty = Math.max(0, Math.min(23 * 60 + 30, Math.round((y / HODINA_PX) * 2) * 30));
    const hh = String(Math.floor(minuty / 60)).padStart(2, '0');
    const mm = String(minuty % 60).padStart(2, '0');
    onSlotClick(day, `${hh}:${mm}`);
  };

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="rounded-xl border border-[var(--border-default)] overflow-hidden" style={{ minWidth: days.length > 1 ? 760 : undefined }}>
        {/*
          Hlavička i celodenní pruh jsou UVNITŘ rolovacího kontejneru a drží se
          přes sticky. Když byly nad ním, zúžil svislý posuvník jen mřížku pod
          nimi — sedm sloupců si tu ztrátu rozdělilo a doprava se rozdíl
          kumuloval, takže hlavička s mřížkou opticky nelícovala.
        */}
        <div ref={scrollRef} className="max-h-[620px] overflow-y-auto">
        <div className="sticky top-0 z-40 bg-[var(--bg-primary)]">
        {/* Hlavička dnů */}
        <div className="grid border-b border-[var(--border-default)]" style={mrizka}>
          <div className="bg-[var(--bg-surface)]" />
          {days.map((day, idx) => {
            const dnesek = isToday(day);
            return (
              <button
                key={idx}
                onClick={() => onDayClick(day)}
                className={cn(
                  'py-2 text-center border-l border-[var(--border-default)] transition-colors hover:bg-[var(--bg-surface-hover)]',
                  dnesek ? 'bg-[var(--color-primary)]/10' : 'bg-[var(--bg-surface)]',
                )}
              >
                <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                  {format(day, 'EEE', { locale: cs })}
                </div>
                <div
                  className={cn(
                    'text-lg font-semibold leading-tight',
                    dnesek ? 'text-[var(--color-primary)]' : 'text-[var(--text-primary)]',
                  )}
                >
                  {day.getDate()}
                </div>
              </button>
            );
          })}
        </div>

        {/* Celodenní pruh — tábory, celodenní události a termíny úkolů */}
        <div className="grid border-b border-[var(--border-default)]" style={mrizka}>
          <div className="flex items-start justify-end pr-1.5 pt-1.5 text-[10px] text-[var(--text-muted)]">
            celý den
          </div>
          {days.map((day, idx) => (
            <div key={idx} className="min-h-[34px] p-1 space-y-1 border-l border-[var(--border-default)]">
              {celodenniProDen(day).map((event) => {
                const barva = event.color || EVENT_TYPE_CONFIG[event.event_type].color;
                return (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    title={event.title}
                    className="w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium truncate hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: `${barva}25`, color: barva }}
                  >
                    {event.title}
                  </button>
                );
              })}
              {ukolyProDen(day).map((task) => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  title={task.title}
                  className="w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium truncate hover:opacity-80 transition-opacity"
                  style={taskChipStyle(task.date)}
                >
                  📋 {task.title}
                </button>
              ))}
            </div>
          ))}
        </div>
        </div>

        {/* Časová mřížka */}
          <div className="grid" style={{ ...mrizka, height: DEN_PX }}>
            {/* Osa hodin */}
            <div className="relative">
              {Array.from({ length: 24 }, (_, h) => (
                <div
                  key={h}
                  className="absolute right-1.5 -translate-y-1/2 text-[10px] text-[var(--text-muted)] tabular-nums"
                  style={{ top: h * HODINA_PX }}
                >
                  {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
                </div>
              ))}
            </div>

            {days.map((day, idx) => {
              const klic = toDateKey(day);
              const dnesek = isToday(day);
              const seznam = rozvrhDne.get(klic) ?? [];

              return (
                <div
                  key={idx}
                  onClick={(e) => handleSlotClick(day, e)}
                  className="relative border-l border-[var(--border-default)] cursor-pointer"
                >
                  {/* Vodorovné linky hodin */}
                  {Array.from({ length: 24 }, (_, h) => (
                    <div
                      key={h}
                      className="absolute inset-x-0 border-t border-[var(--border-default)]/50"
                      style={{ top: h * HODINA_PX }}
                    />
                  ))}

                  {/* Čára "teď" */}
                  {dnesek && (
                    <div
                      className="absolute inset-x-0 z-20 pointer-events-none"
                      style={{ top: ((ted.getHours() * 60 + ted.getMinutes()) / 60) * HODINA_PX }}
                    >
                      <div className="h-px bg-[#F87171]" />
                      <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-[#F87171]" />
                    </div>
                  )}

                  {/* Události */}
                  {seznam.map(({ polozka, sloupec, sloupcu }) => {
                    const { event } = polozka;
                    const barva = event.color || EVENT_TYPE_CONFIG[event.event_type].color;
                    const vyska = ((polozka.do - polozka.od) / 60) * HODINA_PX;
                    const sirka = 100 / sloupcu;
                    return (
                      <button
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                        title={`${formatTime(event.start_date)} ${event.title}`}
                        className="absolute z-10 overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-[11px] leading-tight hover:z-30 hover:shadow-lg transition-shadow"
                        style={{
                          top: (polozka.od / 60) * HODINA_PX,
                          height: Math.max(18, vyska - 2),
                          left: `calc(${sloupec * sirka}% + 2px)`,
                          width: `calc(${sirka}% - 4px)`,
                          backgroundColor: `${barva}22`,
                          borderColor: `${barva}55`,
                          color: barva,
                        }}
                      >
                        <span className="font-medium block truncate">{event.title}</span>
                        {vyska >= 34 && (
                          <span className="block truncate opacity-75">
                            {formatTime(event.start_date)}
                            {event.end_date && ` – ${formatTime(event.end_date)}`}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
