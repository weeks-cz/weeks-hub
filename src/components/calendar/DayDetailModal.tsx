'use client';

import { Plus, CalendarDays, ClipboardList } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EventCard } from './EventCard';
import { format } from '@/lib/utils/date';
import { cs } from 'date-fns/locale';
import type { CalendarEvent } from '@/types/database';

export interface DayTask {
  id: string;
  title: string;
  date: string;
}

interface DayDetailModalProps {
  date: Date | null;
  events: CalendarEvent[];
  tasks: DayTask[];
  onClose: () => void;
  onEventClick: (event: CalendarEvent) => void;
  onTaskClick: (task: DayTask) => void;
  onCreateEvent: () => void;
}

/**
 * Detail dne. Kliknutí na den dřív otevíralo rovnou formulář nové události,
 * takže se nedalo "podívat se, co ten den je" — jediná cesta ke shrnutí dne
 * bylo něco založit a zase zavřít.
 */
export function DayDetailModal({
  date,
  events,
  tasks,
  onClose,
  onEventClick,
  onTaskClick,
  onCreateEvent,
}: DayDetailModalProps) {
  if (!date) return null;

  const nadpis = format(date, 'EEEE d. MMMM yyyy', { locale: cs });
  const prazdno = events.length === 0 && tasks.length === 0;

  return (
    <Modal isOpen={!!date} onClose={onClose} title={nadpis.charAt(0).toUpperCase() + nadpis.slice(1)}>
      <div className="space-y-5">
        {prazdno && (
          <div className="text-center py-6">
            <CalendarDays className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">Tenhle den nemáš nic naplánovaného.</p>
          </div>
        )}

        {events.length > 0 && (
          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
              <CalendarDays className="w-3.5 h-3.5" />
              Události ({events.length})
            </h3>
            <div className="space-y-2">
              {events.map((event) => (
                <EventCard key={event.id} event={event} onClick={() => onEventClick(event)} />
              ))}
            </div>
          </section>
        )}

        {tasks.length > 0 && (
          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
              <ClipboardList className="w-3.5 h-3.5" />
              Termín úkolů ({tasks.length})
            </h3>
            <div className="space-y-1.5">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="w-full text-left p-3 rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-[1px]"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.25)' }}
                >
                  <span className="text-sm font-medium text-[var(--text-primary)]">{task.title}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="pt-1 border-t border-[var(--border-default)]">
          <Button onClick={onCreateEvent} className="w-full">
            <Plus className="w-4 h-4" />
            Přidat událost na tento den
          </Button>
        </div>
      </div>
    </Modal>
  );
}
