'use client';

import { useState, useMemo } from 'react';
import { Baby, Plus, Upload, RefreshCw, Search } from 'lucide-react';
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Děti</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {children.length} {children.length === 1 ? 'dítě' : children.length >= 2 && children.length <= 4 ? 'děti' : 'dětí'}
            {' · '}
            {totalVisits} {totalVisits === 1 ? 'návštěva' : totalVisits >= 2 && totalVisits <= 4 ? 'návštěvy' : 'návštěv'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hledat podle jména…"
          className="w-full pl-9 pr-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
        />
      </div>

      {loading ? (
        <TaskListSkeleton />
      ) : error ? (
        <EmptyState icon={<Baby className="w-6 h-6" />} title="Načtení selhalo" description={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Baby className="w-6 h-6" />}
          title={children.length === 0 ? 'Zatím tu nikdo není' : 'Nikdo nenalezen'}
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
                <th className="px-4 py-3 font-medium">Jméno</th>
                <th className="px-4 py-3 font-medium">Věk</th>
                <th className="px-4 py-3 font-medium">Návštěv</th>
                <th className="px-4 py-3 font-medium">Poslední tábor</th>
                <th className="px-4 py-3 font-medium">Zdroj</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((child: Child) => {
                const source = CHILD_SOURCE_CONFIG[child.source];
                const lastVisit = child.visits?.find((v) => v.visit_date);

                return (
                  <tr
                    key={child.id}
                    onClick={() => setSelectedId(child.id)}
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
