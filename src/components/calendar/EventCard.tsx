'use client';

import { EVENT_TYPE_CONFIG, type CalendarEvent } from '@/types/database';
import { formatTime } from '@/lib/utils/date';

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: () => void;
}

export function EventCard({ event, compact = false, onClick }: EventCardProps) {
  const config = EVENT_TYPE_CONFIG[event.event_type];
  const color = event.color || config.color;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left px-1.5 py-0.5 rounded text-xs font-medium truncate hover:opacity-80 transition-opacity"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {event.title}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl border transition-all hover:shadow-md"
      style={{
        backgroundColor: `${color}10`,
        borderColor: `${color}30`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm font-medium text-[var(--text-primary)] truncate">
              {event.title}
            </span>
          </div>
          {!event.all_day && (
            <span className="text-xs text-[var(--text-muted)]">
              {formatTime(event.start_date)}
              {event.end_date && ` – ${formatTime(event.end_date)}`}
            </span>
          )}
          {event.all_day && (
            <span className="text-xs text-[var(--text-muted)]">Celý den</span>
          )}
        </div>
        <span
          className="text-xs px-1.5 py-0.5 rounded font-medium shrink-0"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {config.label}
        </span>
      </div>
    </button>
  );
}
