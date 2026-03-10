'use client';

import { Avatar } from '@/components/ui/Avatar';
import { useActivityLog, getActivityMessage } from '@/hooks/useActivityLog';
import { formatRelative } from '@/lib/utils/date';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Activity } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export function ActivityFeed() {
  const { activities, loading } = useActivityLog(15);

  if (loading) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)] mb-4">
          Aktivita
        </h3>
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)] mb-4">
        Aktivita
      </h3>

      {activities.length === 0 ? (
        <EmptyState
          icon={<Activity className="w-5 h-5" />}
          title="Zatím žádná aktivita"
          description="Zde se budou zobrazovat akce týmu"
        />
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <Avatar
                src={activity.user?.avatar_url}
                name={activity.user?.full_name || '?'}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-sm text-[var(--text-primary)]">
                  <span className="font-medium">{activity.user?.full_name}</span>{' '}
                  <span className="text-[var(--text-secondary)]">{getActivityMessage(activity)}</span>
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {formatRelative(activity.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
