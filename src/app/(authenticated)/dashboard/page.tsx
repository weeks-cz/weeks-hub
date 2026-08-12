'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useEvents } from '@/hooks/useEvents';
import { useUsers } from '@/hooks/useUsers';
import { useCamps } from '@/hooks/useCamps';
import { useFormSubmissions } from '@/hooks/useFormSubmissions';
import { useRegistrations } from '@/hooks/useRegistrations';
import { AttentionBanner } from '@/components/dashboard/AttentionBanner';
import { FocusStream } from '@/components/dashboard/FocusStream';
import { SeasonPanel } from '@/components/dashboard/SeasonPanel';
import { TeamPanel } from '@/components/dashboard/TeamPanel';
import { CampsOverview } from '@/components/dashboard/CampsOverview';
import { SubmissionsOverview } from '@/components/dashboard/SubmissionsOverview';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { TaskListSkeleton } from '@/components/ui/Skeleton';
import { addDays, format, toDateKey } from '@/lib/utils/date';
import { cs } from 'date-fns/locale';

export default function DashboardPage() {
  const { user } = useAuth();
  const { tasks, loading: tasksLoading } = useTasks();
  const { events, loading: eventsLoading } = useEvents();
  const { users, loading: usersLoading } = useUsers();
  const { camps, loading: campsLoading } = useCamps();
  const { submissions, newCount, loading: submissionsLoading } = useFormSubmissions();
  // Vrací 403 bez oprávnění a chybu si drží uvnitř, takže se dá volat vždycky;
  // panel se pak prostě nevykreslí.
  const { registrations, byTerm, error: regError } = useRegistrations();

  const dnes = new Date();
  const doTydne = addDays(dnes, 7);

  // Události od teď do týdne — do proudu se stejně dostane jen to,
  // co spadne do „po termínu / dnes / tento týden".
  const nadchazejiciUdalosti = events.filter((e) => {
    const den = e.start_date.slice(0, 10);
    return den >= toDateKey(dnes) && den <= toDateKey(doTydne);
  });

  const datum = format(dnes, 'EEEE d. MMMM', { locale: cs });

  return (
    <div className="space-y-5">
      {/* Uvítání */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">
            <span className="text-[var(--text-primary)]">Ahoj, </span>
            <span className="text-gradient">{user?.full_name?.split(' ')[0] || 'tam'}</span>
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1 first-letter:uppercase">{datum}</p>
        </div>
        <QuickActions />
      </header>

      {/* Co hoří — vykreslí se jen když je co */}
      {!submissionsLoading && !campsLoading && (
        <AttentionBanner submissions={submissions} camps={camps} registrations={registrations} />
      )}

      {/*
        Jeden strom pro mobil i desktop. Dřív tu byly dvě větve (lg:hidden
        a hidden lg:block), takže se každá komponenta mountovala dvakrát.
        Pořadí na mobilu řídí `order-*`, na desktopu mřížka.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 items-start">
        <div className="order-1 lg:row-span-2">
          {tasksLoading || eventsLoading ? (
            <TaskListSkeleton />
          ) : (
            <FocusStream tasks={tasks} events={nadchazejiciUdalosti} currentUserId={user?.id} />
          )}
        </div>

        <div className="order-2 space-y-4">
          <SeasonPanel registrations={registrations} byTerm={byTerm} error={regError} />
          {campsLoading ? <TaskListSkeleton /> : <CampsOverview camps={camps} />}
        </div>

        <div className="order-3 space-y-4">
          {submissionsLoading ? (
            <TaskListSkeleton />
          ) : (
            <SubmissionsOverview submissions={submissions} newCount={newCount} />
          )}
          {tasksLoading || usersLoading ? (
            <TaskListSkeleton />
          ) : (
            <TeamPanel tasks={tasks} users={users} currentUserId={user?.id} />
          )}
        </div>
      </div>
    </div>
  );
}
