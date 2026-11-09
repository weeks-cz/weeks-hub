import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { createIotAdminClient } from '@/lib/supabase/iot-server';
import { jeAdmin } from '@/lib/auth/jeAdmin';
import { NemasOpravneni } from '@/components/ui/NemasOpravneni';
import { PageHeader } from '@/components/ui/PageHeader';
import { jeInterni } from '@/lib/utils/ucebna';

export const dynamic = 'force-dynamic';

/** Kolik posledních účtů vypisujeme. */
const LIMIT = 100;

interface UserRow {
  id: string;
  email: string;
  deti: string[];
  zdroj: string | null;
  interni: boolean;
  onboarding: boolean;
  created_at: string;
  updated_at: string;
  completed_count: number;
}

/**
 * Účty rodičů z učebny v2 (`parents` → `children` → `progress`). Dřív se četla
 * tabulka `learning_accounts` z původní učebny, která už neexistuje — stránka
 * pak tvrdila „zatím se nepřipojil nikdo“.
 */
async function fetchUsers(): Promise<{ users: UserRow[]; chyba: string | null }> {
  const iot = createIotAdminClient();

  const { data: parents, error } = await iot
    .from('parents')
    .select('id, email, utm_source, utm_medium, onboarding_completed_at, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(LIMIT);

  if (error) return { users: [], chyba: error.message };
  if (!parents?.length) return { users: [], chyba: null };

  const { data: children, error: chybaDeti } = await iot
    .from('children')
    .select('id, parent_id, nick')
    .is('archived_at', null)
    .in('parent_id', parents.map((p) => p.id as string));

  const childIds = (children ?? []).map((c) => c.id as string);
  const { data: progress, error: chybaPostupu } = childIds.length
    ? await iot.from('progress').select('child_id').eq('status', 'completed').in('child_id', childIds)
    : { data: [], error: null };

  const hotovoPodleDitete = new Map<string, number>();
  for (const p of progress ?? []) {
    hotovoPodleDitete.set(p.child_id as string, (hotovoPodleDitete.get(p.child_id as string) ?? 0) + 1);
  }

  const users = parents.map((p) => {
    const jehoDeti = (children ?? []).filter((c) => c.parent_id === p.id);
    return {
      id: p.id as string,
      email: (p.email as string | null) ?? '—',
      deti: jehoDeti.map((c) => (c.nick as string | null) ?? '—'),
      zdroj: p.utm_source ? `${p.utm_source}${p.utm_medium ? ` / ${p.utm_medium}` : ''}` : null,
      interni: jeInterni(p.email as string | null),
      onboarding: Boolean(p.onboarding_completed_at),
      created_at: p.created_at as string,
      updated_at: p.updated_at as string,
      completed_count: jehoDeti.reduce((s, c) => s + (hotovoPodleDitete.get(c.id as string) ?? 0), 0),
    };
  });

  return { users, chyba: chybaDeti?.message ?? chybaPostupu?.message ?? null };
}

const formatDatum = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
const formatCas = new Intl.DateTimeFormat('cs-CZ', {
  day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit',
});

export default async function LearningUsersPage() {
  if (!(await jeAdmin())) return <NemasOpravneni sekce="Learning" />;

  const { users, chyba } = await fetchUsers();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        icon={Users}
        title="Účty v Learning"
        subtitle={
          users.length === 0
            ? 'Zatím se nezaregistroval nikdo'
            : `Posledních ${users.length} účtů rodičů`
        }
        actions={
          <Link
            href="/admin/learning"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Přehled
          </Link>
        }
      />

      {chyba && (
        <div className="rounded-2xl border border-[var(--color-error)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--color-error)]">
          Data z učebny se nepodařilo načíst celá: {chyba}
        </div>
      )}

      {users.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-10 text-center">
          <p className="text-sm text-[var(--text-primary)]">Žádné účty</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Účet zakládá rodič na ucebna.weeks.cz. Děti se můžou učit i bez něj, ty tu nejsou.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-surface-hover)] text-left">
                <tr>
                  {['E-mail', 'Děti', 'Zdroj', 'Registrace', 'Poslední změna'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-medium text-[var(--text-muted)]">
                      {h}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-muted)]">
                    Dokončené lekce
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-[var(--bg-surface-hover)]">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">
                      {u.email}
                      {u.interni && <span className="ml-2 font-sans text-[var(--text-muted)]">(tým/test)</span>}
                      {!u.onboarding && <span className="ml-2 font-sans text-[var(--text-muted)]">(nedokončil)</span>}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{u.deti.length ? u.deti.join(', ') : '—'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[var(--bg-surface-hover)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]">
                        {u.zdroj ?? 'přímo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                      {formatDatum.format(new Date(u.created_at))}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                      {formatCas.format(new Date(u.updated_at))}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-[var(--text-primary)]">
                      {u.completed_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
