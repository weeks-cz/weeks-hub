'use client';

import { useState } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import { useRegistrations } from '@/hooks/useRegistrations';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/utils/roles';
import { TermCard } from '@/components/registrace/TermCard';
import { RegistrationDetailPanel } from '@/components/registrace/RegistrationDetailPanel';
import { EmptyState } from '@/components/ui/EmptyState';
import { TaskListSkeleton } from '@/components/ui/Skeleton';
import { REGISTRATION_STATUS_CONFIG, type Registration, type RegistrationStatus } from '@/types/database';
import { cn } from '@/lib/utils/cn';

const STATUS_FILTERS: { value: 'all' | RegistrationStatus; label: string }[] = [
  { value: 'all', label: 'Vše' },
  ...Object.entries(REGISTRATION_STATUS_CONFIG).map(([k, c]) => ({ value: k as RegistrationStatus, label: c.label })),
];

export default function RegistracePage() {
  const { user } = useAuth();
  const { byTerm, loading, error, refetch } = useRegistrations();
  const [statusFilter, setStatusFilter] = useState<'all' | RegistrationStatus>('all');
  const [selected, setSelected] = useState<Registration | null>(null);

  if (!isAdmin(user?.role)) {
    return (
      <EmptyState
        icon={<Users className="w-6 h-6" />}
        title="Nedostupné"
        description="Tato sekce je jen pro administrátory."
      />
    );
  }

  const groups = byTerm
    .map((g) => ({
      ...g,
      registrations: statusFilter === 'all' ? g.registrations : g.registrations.filter((r) => r.status === statusFilter),
    }))
    .filter((g) => g.registrations.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Registrace</h1>
        <div className="flex items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                statusFilter === f.value
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
              )}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={refetch}
            title="Obnovit"
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <TaskListSkeleton />
      ) : error ? (
        <EmptyState
          icon={<Users className="w-6 h-6" />}
          title="Chyba"
          description={error}
          action={
            <button onClick={refetch} className="px-3 py-2 rounded-lg text-sm bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              Zkusit znovu
            </button>
          }
        />
      ) : groups.length === 0 ? (
        <EmptyState icon={<Users className="w-6 h-6" />} title="Žádné registrace" description="Zatím tu nic není." />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <TermCard key={g.termId} group={g} onSelect={setSelected} />
          ))}
        </div>
      )}

      <RegistrationDetailPanel registration={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
