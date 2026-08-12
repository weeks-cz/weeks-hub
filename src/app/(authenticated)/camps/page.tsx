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
import { SearchInput } from '@/components/ui/SearchInput';
import { obsahuje } from '@/lib/utils/text';

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
  const [hledani, setHledani] = useState('');
  const [probehleVidet, setProbehleVidet] = useState(false);

  const syncFromWeb = async () => {
    setIsSyncing(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Nejsi přihlášený');
        return;
      }

      const res = await fetch('/api/sync-camps', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = await res.json();
      if (data.success) {
        const parts = [`${data.created} nových`, `${data.updated} aktualizovaných`];
        if (data.remindersCreated > 0) parts.push(`${data.remindersCreated} upomínek`);
        toast.success(`Sync hotový: ${parts.join(', ')}`);
        refetch();
      } else {
        toast.error(data.error || 'Sync selhal');
      }
    } catch {
      toast.error('Chyba při synchronizaci');
    } finally {
      setIsSyncing(false);
    }
  };

  const dotaz = hledani.trim();
  const filteredCamps = camps
    .filter((c) => statusFilter === 'all' || c.status === statusFilter)
    .filter((c) => !dotaz || obsahuje(c.title, dotaz) || obsahuje(c.location, dotaz));

  const pocetStavu = (v: 'all' | CampStatus) =>
    v === 'all' ? camps.length : camps.filter((c) => c.status === v).length;

  // Split into upcoming and past
  const now = new Date().toISOString().slice(0, 10);
  const upcomingCamps = filteredCamps.filter((c) => c.end_date >= now);
  const pastCamps = filteredCamps.filter((c) => c.end_date < now);

  // Obsazenost nadcházejících turnusů dohromady — jednotlivé karty ji ukazují
  // po jedné, ale "kolik máme celkem naplněno" bylo potřeba počítat z hlavy.
  const mistCelkem = upcomingCamps.reduce((s, c) => s + (c.capacity || 0), 0);
  const mistObsazeno = upcomingCamps.reduce((s, c) => s + (c.enrolled_count || 0), 0);

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
            {filter.label}{' '}
            <span className="text-xs opacity-60 tabular-nums">{pocetStavu(filter.value)}</span>
          </button>
        ))}
        <SearchInput
          value={hledani}
          onChange={setHledani}
          placeholder="Název nebo místo…"
          label="Hledat tábor"
          className="w-full sm:w-56 sm:ml-auto"
        />
      </div>

      {loading ? (
        <TaskListSkeleton />
      ) : filteredCamps.length === 0 ? (
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-8">
          <EmptyState
            icon={<Tent className="w-6 h-6" />}
            title="Žádné tábory"
            description={hledani.trim() ? `Na „${hledani.trim()}" nic nesedí.` : statusFilter === 'all' ? 'Zatím nebyl vytvořen žádný tábor.' : 'V tomhle stavu žádný tábor není.'}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming camps */}
          {upcomingCamps.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 font-[family-name:var(--font-heading)]">
                Nadcházející ({upcomingCamps.length})
                {mistCelkem > 0 && (
                  <span className="ml-2 font-normal text-[var(--text-muted)]">
                    obsazeno {mistObsazeno}/{mistCelkem}
                  </span>
                )}
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
              {/* Proběhlých se za sezónu nasbírá přes dvacet. Rozbalují se samy
                  jen tehdy, když nadcházející žádný není — jinak by zabraly
                  celou obrazovku a to podstatné by bylo pod nimi. */}
              <button
                onClick={() => setProbehleVidet((v) => !v)}
                className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-3 font-[family-name:var(--font-heading)] transition-colors"
              >
                Proběhlé ({pastCamps.length}) {probehleVidet || upcomingCamps.length === 0 ? '▴' : '▾'}
              </button>
              {(probehleVidet || upcomingCamps.length === 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 opacity-60">
                  {pastCamps.map((camp) => (
                    <CampCard key={camp.id} camp={camp} onClick={() => setSelectedCamp(camp)} />
                  ))}
                </div>
              )}
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
