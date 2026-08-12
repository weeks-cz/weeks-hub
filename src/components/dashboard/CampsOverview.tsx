'use client';

import Link from 'next/link';
import { Tent, Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { CAMP_STATUS_CONFIG, type Camp } from '@/types/database';
import { formatDateShort } from '@/lib/utils/date';

interface CampsOverviewProps {
  camps: Camp[];
}

export function CampsOverview({ camps }: CampsOverviewProps) {
  // Show upcoming camps (not past, not closed)
  const now = new Date().toISOString().slice(0, 10);
  const activeCamps = camps
    .filter((c) => c.end_date >= now && c.status !== 'closed')
    .slice(0, 5);

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
          Tábory
        </h3>
        <Link href="/camps" className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors">
          Všechny tábory →
        </Link>
      </div>

      {activeCamps.length === 0 ? (
        <EmptyState
          icon={<Tent className="w-5 h-5" />}
          title="Žádné nadcházející tábory"
          description="Všechny turnusy jsou uzavřené nebo už proběhly"
        />
      ) : (
        <div className="space-y-2">
          {activeCamps.map((camp) => {
            const statusConfig = CAMP_STATUS_CONFIG[camp.status];
            const fillPercent = camp.capacity > 0 ? Math.min(100, (camp.enrolled_count / camp.capacity) * 100) : 0;

            return (
              <Link
                key={camp.id}
                href="/camps"
                className="block p-3 rounded-xl border border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {camp.title}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ml-2"
                    style={{ backgroundColor: `${statusConfig.color}20`, color: statusConfig.color }}
                  >
                    {statusConfig.label}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)] mb-2">
                  {formatDateShort(camp.start_date)} – {formatDateShort(camp.end_date)}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-surface-hover)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${fillPercent}%`,
                        backgroundColor: fillPercent >= 100 ? '#EF4444' : fillPercent >= 75 ? '#F59E0B' : '#10B981',
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] shrink-0">
                    <Users className="w-3 h-3" />
                    {camp.enrolled_count}/{camp.capacity}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
