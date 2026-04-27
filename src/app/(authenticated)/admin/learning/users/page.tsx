import Link from 'next/link';
import { createIotAdminClient } from '@/lib/supabase/iot-server';

export const dynamic = 'force-dynamic';

interface UserRow {
  id: string;
  email: string;
  nickname: string | null;
  created_at: string;
  updated_at: string;
  completed_count: number;
  source: 'pin-link' | 'web-register' | 'unknown';
}

async function fetchUsers(): Promise<UserRow[]> {
  const iot = createIotAdminClient();

  const { data: accounts } = await iot
    .from('learning_accounts')
    .select('id, state, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (!accounts) return [];

  const userIds = accounts.map((a) => a.id as string);

  const { data: authUsers } = await iot.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map<string, string>();
  for (const u of authUsers?.users ?? []) {
    if (userIds.includes(u.id)) emailById.set(u.id, u.email ?? '—');
  }

  const { data: signups } = await iot
    .from('learning_events')
    .select('user_id, metadata')
    .eq('event_type', 'signup')
    .in('user_id', userIds);

  const sourceById = new Map<string, 'pin-link' | 'web-register'>();
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

export default async function LearningUsersPage() {
  const users = await fetchUsers();

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <header className="flex items-center gap-3">
        <Link href="/admin/learning" className="text-sm text-[var(--color-primary)] hover:underline">
          ← Learning
        </Link>
        <span className="text-[var(--text-muted)]">/</span>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
          Uživatelé
        </h1>
      </header>
      <p className="text-sm text-[var(--text-muted)]">Posledních 100 propojených účtů.</p>

      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-surface-hover)] text-left">
              <tr>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)] font-medium">Email</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)] font-medium">Nickname</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)] font-medium">Zdroj</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)] font-medium">Signup</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)] font-medium">Poslední aktivita</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-muted)] font-medium text-right">Úkoly ✓</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{u.email}</td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">{u.nickname ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.source === 'pin-link'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : u.source === 'web-register'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)]'
                    }`}>
                      {u.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                    {new Date(u.created_at).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                    {new Date(u.updated_at).toLocaleString('cs-CZ')}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--text-primary)]">
                    {u.completed_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="p-8 text-center text-[var(--text-muted)]">Žádné účty zatím.</p>
          )}
        </div>
      </div>
    </div>
  );
}
