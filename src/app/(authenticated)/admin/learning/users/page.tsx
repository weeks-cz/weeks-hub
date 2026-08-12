import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { createIotAdminClient } from '@/lib/supabase/iot-server';
import { jeAdmin } from '@/lib/auth/jeAdmin';
import { NemasOpravneni } from '@/components/ui/NemasOpravneni';
import { PageHeader } from '@/components/ui/PageHeader';

export const dynamic = 'force-dynamic';

/** Kolik posledních účtů vypisujeme. */
const LIMIT = 100;

type Zdroj = 'pin-link' | 'web-register' | 'unknown';

interface UserRow {
  id: string;
  email: string;
  nickname: string | null;
  created_at: string;
  updated_at: string;
  completed_count: number;
  source: Zdroj;
}

const ZDROJ: Record<Zdroj, { label: string; trida: string }> = {
  'pin-link': { label: 'Z tábora', trida: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  'web-register': { label: 'Z webu', trida: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  unknown: { label: 'Neznámý', trida: 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)]' },
};

/**
 * E-maily k účtům.
 *
 * Dřív se pro každý účet volalo `getUserById` zvlášť — sto volání auth API na
 * jedno otevření stránky. `listUsers` vrátí totéž v pár dávkách.
 */
async function nactiEmaily(iot: ReturnType<typeof createIotAdminClient>, idcka: Set<string>) {
  const mapa = new Map<string, string>();
  const NA_STRANKU = 200;
  const MAX_STRANEK = 10;

  for (let strana = 1; strana <= MAX_STRANEK; strana++) {
    const { data, error } = await iot.auth.admin.listUsers({ page: strana, perPage: NA_STRANKU });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      if (idcka.has(u.id)) mapa.set(u.id, u.email ?? '—');
    }
    // Máme všechny hledané, zbytek stránek už nemá co přidat.
    if (mapa.size === idcka.size || data.users.length < NA_STRANKU) break;
  }
  return mapa;
}

async function fetchUsers(): Promise<UserRow[]> {
  const iot = createIotAdminClient();

  const { data: accounts } = await iot
    .from('learning_accounts')
    .select('id, state, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(LIMIT);

  if (!accounts?.length) return [];

  const userIds = new Set(accounts.map((a) => a.id as string));
  const [emailById, { data: signups }] = await Promise.all([
    nactiEmaily(iot, userIds),
    iot
      .from('learning_events')
      .select('user_id, metadata')
      .eq('event_type', 'signup')
      .in('user_id', [...userIds]),
  ]);

  const sourceById = new Map<string, Exclude<Zdroj, 'unknown'>>();
  for (const s of signups ?? []) {
    const src = (s.metadata as { source?: string } | null)?.source;
    if (s.user_id && (src === 'pin-link' || src === 'web-register')) {
      sourceById.set(s.user_id as string, src);
    }
  }

  return accounts.map((a) => {
    const tasks = (a.state as { tasks?: Record<string, { status?: string }> } | null)?.tasks ?? {};
    const completed = Object.values(tasks).filter((t) => t?.status === 'completed').length;
    const nickname = (a.state as { account?: { nickname?: string } } | null)?.account?.nickname ?? null;
    return {
      id: a.id as string,
      email: emailById.get(a.id as string) ?? '—',
      nickname,
      created_at: a.created_at as string,
      updated_at: a.updated_at as string,
      completed_count: completed,
      source: sourceById.get(a.id as string) ?? 'unknown',
    };
  });
}

const formatDatum = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
const formatCas = new Intl.DateTimeFormat('cs-CZ', {
  day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit',
});

export default async function LearningUsersPage() {
  if (!(await jeAdmin())) return <NemasOpravneni sekce="Learning" />;

  const users = await fetchUsers();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        icon={Users}
        title="Účty v Learning"
        subtitle={
          users.length === 0
            ? 'Zatím se nepřipojil nikdo'
            : `Posledních ${users.length} připojených účtů`
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

      {users.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-10 text-center">
          <p className="text-sm text-[var(--text-primary)]">Žádné účty</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Účty vznikají, když si dítě propojí aplikaci PINem z tábora nebo se zaregistruje na webu.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-surface-hover)] text-left">
                <tr>
                  {['E-mail', 'Přezdívka', 'Zdroj', 'Registrace', 'Poslední aktivita'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-medium text-[var(--text-muted)]">
                      {h}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-muted)]">
                    Splněné úkoly
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-[var(--bg-surface-hover)]">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{u.email}</td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{u.nickname ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ZDROJ[u.source].trida}`}>
                        {ZDROJ[u.source].label}
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
