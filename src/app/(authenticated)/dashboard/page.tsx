'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useEvents } from '@/hooks/useEvents';
import { useUsers } from '@/hooks/useUsers';
import { useCamps } from '@/hooks/useCamps';
import { useFormSubmissions } from '@/hooks/useFormSubmissions';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { MyTasks } from '@/components/dashboard/MyTasks';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { CampsOverview } from '@/components/dashboard/CampsOverview';
import { SubmissionsOverview } from '@/components/dashboard/SubmissionsOverview';
import { TeamTasks } from '@/components/dashboard/TeamTasks';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { StatsCardsSkeleton, TaskListSkeleton } from '@/components/ui/Skeleton';
import { addDays } from '@/lib/utils/date';

export default function DashboardPage() {
  const { user } = useAuth();
  const { tasks, loading: tasksLoading } = useTasks();
  const { events, loading: eventsLoading } = useEvents();
  const { users, loading: usersLoading } = useUsers();
  const { camps, loading: campsLoading } = useCamps();
  const { submissions, newCount, loading: submissionsLoading } = useFormSubmissions();

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
    <div className="space-y-6 relative">
      {/* Decorative blobs */}
      <div className="blob blob-primary w-[300px] h-[300px] -top-32 -right-32" />
      <div className="blob blob-accent w-[200px] h-[200px] top-64 -left-24" />

      {/* Welcome + Quick Actions */}
      <div className="flex items-center justify-between relative">
        <div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)]">
            <span className="text-[var(--text-primary)]">Ahoj, </span>
            <span className="text-gradient">{user?.full_name?.split(' ')[0] || 'tam'}</span>
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Tady je přehled tvého dne
          </p>
        </div>
        <QuickActions />
      </div>

      {/* === MOBILE LAYOUT (lg:hidden) === */}
      <div className="lg:hidden space-y-4">
        {/* 1. Tasky first */}
        {tasksLoading ? <TaskListSkeleton /> : <MyTasks tasks={myTasks} />}

        {/* 2. Stats */}
        {tasksLoading || eventsLoading || usersLoading ? (
          <StatsCardsSkeleton />
        ) : (
          <StatsCards tasks={tasks} events={events} users={users} />
        )}

        {/* 3. Události */}
        {eventsLoading ? <TaskListSkeleton /> : <UpcomingEvents events={upcomingEvents} />}

        {/* 4. Tábory */}
        {campsLoading ? <TaskListSkeleton /> : <CampsOverview camps={camps} />}

        {/* 5. Formuláře */}
        {submissionsLoading ? (
          <TaskListSkeleton />
        ) : (
          <SubmissionsOverview submissions={submissions} newCount={newCount} />
        )}

        {/* 6. Tým */}
        {tasksLoading || usersLoading ? (
          <TaskListSkeleton />
        ) : (
          <TeamTasks tasks={tasks} users={users} currentUserId={user?.id} />
        )}
      </div>

      {/* === DESKTOP LAYOUT (hidden lg:block) === */}
      <div className="hidden lg:block space-y-6">
        {/* Stats */}
        {tasksLoading || eventsLoading || usersLoading ? (
          <StatsCardsSkeleton />
        ) : (
          <StatsCards tasks={tasks} events={events} users={users} />
        )}

        {/* Bento Grid */}
        <div className="grid grid-cols-[3fr_2fr] gap-4">
          {/* My Tasks — spans 2 rows */}
          <div className="row-span-2">
            {tasksLoading ? <TaskListSkeleton /> : <MyTasks tasks={myTasks} />}
          </div>

          {/* Upcoming Events */}
          {eventsLoading ? <TaskListSkeleton /> : <UpcomingEvents events={upcomingEvents} />}

          {/* Camps */}
          {campsLoading ? <TaskListSkeleton /> : <CampsOverview camps={camps} />}

          {/* Bottom row: Submissions + Team */}
          {submissionsLoading ? (
            <TaskListSkeleton />
          ) : (
            <SubmissionsOverview submissions={submissions} newCount={newCount} />
          )}

          {tasksLoading || usersLoading ? (
            <TaskListSkeleton />
          ) : (
            <TeamTasks tasks={tasks} users={users} currentUserId={user?.id} />
          )}
        </div>
      </div>
    </div>
  );
}
