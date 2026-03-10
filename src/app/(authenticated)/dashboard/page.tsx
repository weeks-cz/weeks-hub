'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useEvents } from '@/hooks/useEvents';
import { useUsers } from '@/hooks/useUsers';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { MyTasks } from '@/components/dashboard/MyTasks';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { LoadingPage, LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { addDays } from '@/lib/utils/date';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { tasks, loading: tasksLoading } = useTasks();
  const { events, loading: eventsLoading } = useEvents();
  const { users, loading: usersLoading } = useUsers();

  if (authLoading) {
    return <LoadingPage />;
  }

  // My tasks (assigned to current user, not done)
  const myTasks = tasksLoading ? [] : tasks.filter(
    (t) => t.assignee_id === user?.id && t.status !== 'done'
  );

  // Upcoming events (next 7 days)
  const now = new Date();
  const weekFromNow = addDays(now, 7);
  const upcomingEvents = eventsLoading ? [] : events.filter((e) => {
    const start = new Date(e.start_date);
    return start >= now && start <= weekFromNow;
  });

  return (
    <div className="space-y-6">
      {/* Welcome + Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
            Ahoj, {user?.full_name?.split(' ')[0] || 'tam'}! 👋
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Tady je přehled tvého dne
          </p>
        </div>
        <QuickActions />
      </div>

      {/* Stats */}
      {tasksLoading || eventsLoading || usersLoading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : (
        <StatsCards tasks={tasks} events={events} users={users} />
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {tasksLoading ? (
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4 flex justify-center py-8"><LoadingSpinner /></div>
          ) : (
            <MyTasks tasks={myTasks} />
          )}
          {eventsLoading ? (
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4 flex justify-center py-8"><LoadingSpinner /></div>
          ) : (
            <UpcomingEvents events={upcomingEvents} />
          )}
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
