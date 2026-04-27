import { createIotAdminClient } from '@/lib/supabase/iot-server';

export const dynamic = 'force-dynamic';

function sevenDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

function thirtyDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

async function fetchStats() {
  const iot = createIotAdminClient();

  const [
    totalAccountsRes,
    active7dRes,
    completes7dRes,
    pinLinkRes,
    webRegisterRes,
    signups30dRes,
    topTasks7dRes,
  ] = await Promise.all([
    iot.from('learning_accounts').select('*', { count: 'exact', head: true }),
    iot.from('learning_accounts').select('*', { count: 'exact', head: true })
       .gte('updated_at', sevenDaysAgo()),
    iot.from('learning_events').select('*', { count: 'exact', head: true })
       .eq('event_type', 'task_complete').gte('created_at', sevenDaysAgo()),
    iot.from('learning_events').select('*', { count: 'exact', head: true })
       .eq('event_type', 'signup').contains('metadata', { source: 'pin-link' }),
    iot.from('learning_events').select('*', { count: 'exact', head: true })
       .eq('event_type', 'signup').contains('metadata', { source: 'web-register' }),
    iot.from('learning_events').select('created_at')
       .eq('event_type', 'signup').gte('created_at', thirtyDaysAgo()),
    iot.from('learning_events').select('task_id')
       .eq('event_type', 'task_complete').gte('created_at', sevenDaysAgo())
       .not('task_id', 'is', null),
  ]);

  const signupsByDay: Record<string, number> = {};
  for (const row of signups30dRes.data ?? []) {
    const day = (row.created_at as string).slice(0, 10);
    signupsByDay[day] = (signupsByDay[day] ?? 0) + 1;
  }

  const taskCounts: Record<string, number> = {};
  for (const row of topTasks7dRes.data ?? []) {
    if (row.task_id) taskCounts[row.task_id] = (taskCounts[row.task_id] ?? 0) + 1;
  }
  const topTasks = Object.entries(taskCounts)
    .sort((a, b) => b[1]! - a[1]!)
    .slice(0, 10);

  return {
    totalAccounts: totalAccountsRes.count ?? 0,
    active7d: active7dRes.count ?? 0,
    completes7d: completes7dRes.count ?? 0,
    pinLink: pinLinkRes.count ?? 0,
    webRegister: webRegisterRes.count ?? 0,
    signupsByDay,
    topTasks,
  };
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-5">
      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{value.toLocaleString('cs-CZ')}</p>
    </div>
  );
}

export default async function LearningStatsPage() {
  const stats = await fetchStats();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
          Learning
        </h1>
        <p className="text-sm text-[var(--text-muted)]">Stats z weeks-iot, posledních 30/7 dní.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Účty celkem" value={stats.totalAccounts} />
        <StatCard label="Aktivních (7d)" value={stats.active7d} />
        <StatCard label="Splněných úkolů (7d)" value={stats.completes7d} />
        <StatCard label="Z táborů (pin-link)" value={stats.pinLink} />
        <StatCard label="Z webu (signup)" value={stats.webRegister} />
      </div>

      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Signups (30 dní)</h2>
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4">
          {Object.keys(stats.signupsByDay).length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Zatím žádné signups.</p>
          ) : (
            <pre className="text-xs text-[var(--text-secondary)] font-mono">
              {Object.entries(stats.signupsByDay)
                .sort()
                .map(([day, count]) => `${day}  ${'▮'.repeat(count)} ${count}`)
                .join('\n')}
            </pre>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Top dokončené úkoly (7d)</h2>
          <a href="/admin/learning/users" className="text-sm text-[var(--color-primary)] hover:underline">
            Zobrazit uživatele →
          </a>
        </div>
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] overflow-hidden">
          {stats.topTasks.length === 0 ? (
            <p className="p-4 text-sm text-[var(--text-muted)]">Zatím žádné dokončené úkoly.</p>
          ) : (
            <ol className="divide-y divide-[var(--border-default)]">
              {stats.topTasks.map(([taskId, count], i) => (
                <li key={taskId} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-[var(--text-muted)] w-5">{i + 1}.</span>
                  <span className="flex-1 font-mono text-xs text-[var(--text-secondary)] ml-2">{taskId}</span>
                  <span className="font-semibold text-[var(--text-primary)]">{count}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
