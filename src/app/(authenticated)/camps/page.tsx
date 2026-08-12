'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Tent, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CampCard } from '@/components/camps/CampCard';
import { CreateCampModal } from '@/components/camps/CreateCampModal';
import { CampDetailModal } from '@/components/camps/CampDetailModal';
import { useCamps } from '@/hooks/useCamps';
import { TaskListSkeleton } from '@/components/ui/Skeleton';
import { CAMP_STATUS_CONFIG, type Camp, type CampStatus } from '@/types/database';
import { PageHeader } from '@/components/ui/PageHeader';

const STATUS_FILTERS: { value: 'all' | CampStatus; label: string }[] = [
  { value: 'all', label: 'Vše' },
  ...Object.entries(CAMP_STATUS_CONFIG).map(([key, config]) => ({
    value: key as CampStatus,
    label: config.label,
  })),
];

export default function CampsPage() {
  const { camps, loading, createCamp, updateCamp, deleteCamp, updateEnrollment, refetch } = useCamps();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | CampStatus>('all');
  const [isSyncing, setIsSyncing] = useState(false);

  const syncFromWeb = async () => {
    setIsSyncing(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Nejsi prihlaseny');
        return;
      }

      const res = await fetch('/api/sync-camps', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = await res.json();
      if (data.success) {
        const parts = [`${data.created} novych`, `${data.updated} aktualizovanych`];
        if (data.remindersCreated > 0) parts.push(`${data.remindersCreated} upominek`);
        toast.success(`Sync hotov: ${parts.join(', ')}`);
        refetch();
      } else {
        toast.error(data.error || 'Sync selhal');
      }
    } catch {
      toast.error('Chyba pri synchronizaci');
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredCamps = statusFilter === 'all'
    ? camps
    : camps.filter((c) => c.status === statusFilter);

  // Split into upcoming and past
  const now = new Date().toISOString().slice(0, 10);
  const upcomingCamps = filteredCamps.filter((c) => c.end_date >= now);
  const pastCamps = filteredCamps.filter((c) => c.end_date < now);

  // Keep selectedCamp in sync with camps data
  const currentSelectedCamp = selectedCamp
    ? camps.find((c) => c.id === selectedCamp.id) || selectedCamp
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Tent}
        title="Tábory"
        subtitle="Přehled všech turnusů a jejich obsazenosti"
        actions={
          <>
            <Button variant="secondary" onClick={syncFromWeb} isLoading={isSyncing}>
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync z webu
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" />
              Nový tábor
            </Button>
          </>
        }
      />

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              statusFilter === filter.value
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <TaskListSkeleton />
      ) : filteredCamps.length === 0 ? (
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-8">
          <EmptyState
            icon={<Tent className="w-6 h-6" />}
            title="Zadne tabory"
            description={statusFilter === 'all' ? 'Zatim nebyl vytvoren zadny tabor' : 'Zadne tabory s timto statusem'}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming camps */}
          {upcomingCamps.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 font-[family-name:var(--font-heading)]">
                Nadcházející ({upcomingCamps.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                  {upcomingCamps.map((camp) => (
                    <motion.div
                      key={camp.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CampCard camp={camp} onClick={() => setSelectedCamp(camp)} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Past camps */}
          {pastCamps.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3 font-[family-name:var(--font-heading)]">
                Proběhlé ({pastCamps.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 opacity-60">
                {pastCamps.map((camp) => (
                  <CampCard key={camp.id} camp={camp} onClick={() => setSelectedCamp(camp)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateCampModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createCamp}
      />

      {currentSelectedCamp && (
        <CampDetailModal
          camp={currentSelectedCamp}
          isOpen={!!currentSelectedCamp}
          onClose={() => setSelectedCamp(null)}
          onUpdate={updateCamp}
          onDelete={deleteCamp}
          onEnrollmentChange={updateEnrollment}
        />
      )}
    </div>
  );
}
