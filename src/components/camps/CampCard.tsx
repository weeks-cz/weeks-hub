'use client';

import { MapPin, Users, ExternalLink } from 'lucide-react';
import { CAMP_STATUS_CONFIG, type Camp } from '@/types/database';
import { formatDateShort } from '@/lib/utils/date';

interface CampCardProps {
  camp: Camp;
  onClick?: () => void;
}

export function CampCard({ camp, onClick }: CampCardProps) {
  const statusConfig = CAMP_STATUS_CONFIG[camp.status];
  const fillPercent = camp.capacity > 0 ? Math.min(100, (camp.enrolled_count / camp.capacity) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: camp.color || '#10B981' }}
            />
            <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {camp.title}
            </h3>
          </div>

          <p className="text-xs text-[var(--text-muted)] mb-2">
            {formatDateShort(camp.start_date)} – {formatDateShort(camp.end_date)}
          </p>

          {camp.location && (
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mb-2">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{camp.location}</span>
            </div>
          )}

          {/* Enrollment bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                <Users className="w-3 h-3" />
                <span>{camp.enrolled_count} / {camp.capacity}</span>
              </div>
              {camp.registration_url && (
                <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
              )}
            </div>
            <div className="h-1.5 rounded-full bg-[var(--bg-surface-hover)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${fillPercent}%`,
                  backgroundColor: fillPercent >= 100 ? '#EF4444' : fillPercent >= 75 ? '#F59E0B' : '#10B981',
                }}
              />
            </div>
          </div>
        </div>

        <span
          className="text-xs px-2 py-1 rounded-lg font-medium shrink-0"
          style={{ backgroundColor: `${statusConfig.color}20`, color: statusConfig.color }}
        >
          {statusConfig.label}
        </span>
      </div>
    </button>
  );
}
