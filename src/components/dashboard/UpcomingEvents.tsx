'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { EventCard } from '@/components/calendar/EventCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { CalendarEvent } from '@/types/database';

interface UpcomingEventsProps {
  events: CalendarEvent[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
          Nadcházející události
        </h3>
        <Link href="/calendar" className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors">
          Kalendář →
        </Link>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-5 h-5" />}
          title="Žádné nadcházející události"
          description="Na příštích 7 dní nemáš nic naplánovaného"
        />
      ) : (
        <div className="space-y-2">
          {events.slice(0, 5).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
