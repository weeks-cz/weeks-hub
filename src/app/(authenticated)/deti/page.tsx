'use client';

import { useState, useMemo } from 'react';
import { Baby, Plus, Upload, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useChildren } from '@/hooks/useChildren';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/utils/roles';
import { ChildDetailPanel } from '@/components/deti/ChildDetailPanel';
import { AddChildModal } from '@/components/deti/AddChildModal';
import { ImportModal } from '@/components/deti/ImportModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { TaskListSkeleton } from '@/components/ui/Skeleton';
import { CHILD_SOURCE_CONFIG, type Child } from '@/types/database';
import { formatAge, normalizeName } from '@/lib/children/matching';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

export default function DetiPage() {
  const { user } = useAuth();
  const { children, loading, error, refetch, createChild, updateChild, deleteChild, syncFromRegistrations } =
    useChildren();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [jenVracejici, setJenVracejici] = useState(false);
  const [razeni, setRazeni] = useState<{ sloupec: 'jmeno' | 'vek' | 'navstev'; sestupne: boolean }>({
    sloupec: 'jmeno',
    sestupne: false,
  });

  const filtered = useMemo(() => {
    // Reuse the matching normaliser so "novak jan" finds "Jan Novák" —
    // diacritics and word order don't matter, every typed word must appear.
    const tokens = normalizeName(search).split(' ').filter(Boolean);
    if (tokens.length === 0) return children;

    return children.filter((child) => {
      const name = normalizeName(child.full_name);
      return tokens.every((token) => name.includes(token));
    });
  }, [children, search]);

  // Retence je nejslabší číslo firmy — z patnácti rodin se vrátily dvě. Sloupec
  // s počtem návštěv tu byl odjakživa, ale nešlo podle něj řadit ani filtrovat,
  // takže tu informaci nikdo nepřečetl.
  const vraceli = children.filter((c) => (c.visit_count ?? 0) > 1).length;

  const zobrazene = useMemo(() => {
    const seznam = jenVracejici ? filtered.filter((c) => (c.visit_count ?? 0) > 1) : filtered;
    const smer = razeni.sestupne ? -1 : 1;
    return [...seznam].sort((a, b) => {
      if (razeni.sloupec === 'navstev') return ((a.visit_count ?? 0) - (b.visit_count ?? 0)) * smer;
      if (razeni.sloupec === 'vek') return (a.birthdate ?? '').localeCompare(b.birthdate ?? '') * smer;
      return a.full_name.localeCompare(b.full_name, 'cs') * smer;
    });
  }, [filtered, jenVracejici, razeni]);

  const prepniRazeni = (sloupec: 'jmeno' | 'vek' | 'navstev') =>
    setRazeni((r) => ({ sloupec, sestupne: r.sloupec === sloupec ? !r.sestupne : sloupec === 'navstev' }));

  // Keep the panel bound to fresh data after an edit rather than a stale copy.
  const selected = selectedId ? children.find((c) => c.id === selectedId) ?? null : null;

  if (!isAdmin(user?.role)) {
    return (
      <EmptyState
        icon={<Baby className="w-6 h-6" />}
        title="Nedostupné"
        description="Tato sekce je jen pro administrátory."
      />
    );
  }

  const runSync = async () => {
    setSyncing(true);
    const result = await syncFromRegistrations();
    setSyncing(false);

    if (typeof result === 'string') {
      toast.error(result);
      return;
    }
    if (result.childrenCreated === 0 && result.visitsCreated === 0 && result.childrenUpdated === 0) {
      toast.success('Vše už je aktuální');
      return;
    }
    toast.success(
      `Přidáno ${result.childrenCreated} dětí a ${result.visitsCreated} návštěv, doplněno u ${result.childrenUpdated}`
    );
  };

  const totalVisits = children.reduce((sum, c) => sum + (c.visit_count ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Baby}
        title="Děti"
        subtitle={
          <>
            {children.length} {children.length === 1 ? 'dítě' : children.length >= 2 && children.length <= 4 ? 'děti' : 'dětí'}
            {' · '}
            {totalVisits} {totalVisits === 1 ? 'návštěva' : totalVisits >= 2 && totalVisits <= 4 ? 'návštěvy' : 'návštěv'}
          </>
        }
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={runSync} isLoading={syncing}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Načíst z registrací
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4 mr-1.5" />
              Import
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Přidat dítě
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Hledat podle jména…"
          className="w-full sm:max-w-sm"
        />
        {vraceli > 0 && (
          <button
            onClick={() => setJenVracejici((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              jenVracejici
                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            Vrátili se <span className="tabular-nums">{vraceli}</span>
          </button>
        )}
      </div>

      {loading ? (
        <TaskListSkeleton />
      ) : error ? (
        <EmptyState icon={<Baby className="w-6 h-6" />} title="Načtení selhalo" description={error} />
      ) : zobrazene.length === 0 ? (
        <EmptyState
          icon={<Baby className="w-6 h-6" />}
          title={children.length === 0 ? 'Zatím tu nikdo není' : jenVracejici ? 'Nikdo se zatím nevrátil podruhé' : 'Nikdo nenalezen'}
          description={
            children.length === 0
              ? 'Načtěte děti z registrací, naimportujte soupisku z Excelu nebo přidejte dítě ručně.'
              : 'Zkuste jiné jméno.'
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border-default)]">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-xs text-[var(--text-muted)] border-b border-[var(--border-default)]">
                <th className="px-4 py-3 font-medium">
                  <button onClick={() => prepniRazeni('jmeno')} className="hover:text-[var(--text-primary)] transition-colors">
                    Jméno {razeni.sloupec === 'jmeno' && (razeni.sestupne ? '▾' : '▴')}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button onClick={() => prepniRazeni('vek')} className="hover:text-[var(--text-primary)] transition-colors">
                    Věk {razeni.sloupec === 'vek' && (razeni.sestupne ? '▾' : '▴')}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button onClick={() => prepniRazeni('navstev')} className="hover:text-[var(--text-primary)] transition-colors">
                    Návštěv {razeni.sloupec === 'navstev' && (razeni.sestupne ? '▾' : '▴')}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Poslední tábor</th>
                <th className="px-4 py-3 font-medium">Zdroj</th>
              </tr>
            </thead>
            <tbody>
              {zobrazene.map((child: Child) => {
                const source = CHILD_SOURCE_CONFIG[child.source];
                const lastVisit = child.visits?.find((v) => v.visit_date);

                return (
                  <tr
                    key={child.id}
                    onClick={() => setSelectedId(child.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setSelectedId(child.id);
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={child.full_name}
                    className="border-b border-[var(--border-default)] last:border-0 cursor-pointer hover:bg-[var(--bg-surface-hover)] transition-colors"
                  >
                    <td className="px-4 py-3 text-[var(--text-primary)] font-medium">{child.full_name}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{formatAge(child.birthdate)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center min-w-[1.75rem] px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-semibold">
                        {child.visit_count ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {lastVisit ? (
                        <span title={lastVisit.camp_label}>
                          {lastVisit.camp_label.length > 34
                            ? `${lastVisit.camp_label.slice(0, 34)}…`
                            : lastVisit.camp_label}
                          <span className="text-[var(--text-muted)]"> · {fmtDate(lastVisit.visit_date)}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${source.color}1A`, color: source.color }}
                      >
                        {source.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ChildDetailPanel
          key={selected.id}
          child={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={updateChild}
          onDelete={deleteChild}
        />
      )}

      <AddChildModal isOpen={addOpen} onClose={() => setAddOpen(false)} onCreate={createChild} />
      <ImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} onImported={refetch} />
    </div>
  );
}
