import Link from 'next/link';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { createIotAdminClient } from '@/lib/supabase/iot-server';
import { jeAdmin } from '@/lib/auth/jeAdmin';
import { NemasOpravneni } from '@/components/ui/NemasOpravneni';
import { PageHeader } from '@/components/ui/PageHeader';

export const dynamic = 'force-dynamic';

/** Kolik dní zpět kreslíme graf nových účtů. */
const DNU_ZPET = 30;

function predDny(pocet: number) {
  const d = new Date();
  d.setDate(d.getDate() - pocet);
  return d;
}

function klicDne(d: Date) {
  // Lokální datum, ne toISOString — ten posune půlnoc o časové pásmo.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function fetchStats() {
  const iot = createIotAdminClient();
  const pred7 = predDny(7).toISOString();
  const pred30 = predDny(DNU_ZPET).toISOString();

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
       .gte('updated_at', pred7),
    iot.from('learning_events').select('*', { count: 'exact', head: true })
       .eq('event_type', 'task_complete').gte('created_at', pred7),
    iot.from('learning_events').select('*', { count: 'exact', head: true })
       .eq('event_type', 'signup').contains('metadata', { source: 'pin-link' }),
    iot.from('learning_events').select('*', { count: 'exact', head: true })
       .eq('event_type', 'signup').contains('metadata', { source: 'web-register' }),
    iot.from('learning_events').select('created_at')
       .eq('event_type', 'signup').gte('created_at', pred30),
    iot.from('learning_events').select('task_id')
       .eq('event_type', 'task_complete').gte('created_at', pred7)
       .not('task_id', 'is', null),
  ]);

  const podleDne: Record<string, number> = {};
  for (const row of signups30dRes.data ?? []) {
    const den = (row.created_at as string).slice(0, 10);
    podleDne[den] = (podleDne[den] ?? 0) + 1;
  }

  // Celá řada dní včetně prázdných. Dřív se kreslily jen dny, kdy někdo přišel,
  // takže tři registrace za měsíc vypadaly jako tři dny po sobě.
  const dny = Array.from({ length: DNU_ZPET }, (_, i) => {
    const datum = predDny(DNU_ZPET - 1 - i);
    const klic = klicDne(datum);
    return { klic, datum, pocet: podleDne[klic] ?? 0 };
  });

  const pocty: Record<string, number> = {};
  for (const row of topTasks7dRes.data ?? []) {
    if (row.task_id) pocty[row.task_id] = (pocty[row.task_id] ?? 0) + 1;
  }
  const topTasks = Object.entries(pocty)
    .sort((a, b) => b[1]! - a[1]!)
    .slice(0, 10);

  return {
    totalAccounts: totalAccountsRes.count ?? 0,
    active7d: active7dRes.count ?? 0,
    completes7d: completes7dRes.count ?? 0,
    pinLink: pinLinkRes.count ?? 0,
    webRegister: webRegisterRes.count ?? 0,
    dny,
    signupyCelkem: (signups30dRes.data ?? []).length,
    topTasks,
  };
}

function StatCard({ label, value, popis }: { label: string; value: number; popis?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold tabular-nums text-[var(--text-primary)]">
        {value.toLocaleString('cs-CZ')}
      </p>
      {popis && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{popis}</p>}
    </div>
  );
}

const formatDen = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric' });

export default async function LearningStatsPage() {
  if (!(await jeAdmin())) return <NemasOpravneni sekce="Learning" />;

  const stats = await fetchStats();
  const maximum = Math.max(1, ...stats.dny.map((d) => d.pocet));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        icon={GraduationCap}
        title="Learning"
        subtitle="Účty a aktivita ve výukové aplikaci weeks-iot"
        actions={
          <Link
            href="/admin/learning/users"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
          >
            Účty
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Účty celkem" value={stats.totalAccounts} />
        <StatCard label="Aktivních" value={stats.active7d} popis="za 7 dní" />
        <StatCard label="Splněných úkolů" value={stats.completes7d} popis="za 7 dní" />
        <StatCard label="Z táborů" value={stats.pinLink} popis="přes PIN" />
        <StatCard label="Z webu" value={stats.webRegister} popis="vlastní registrace" />
      </div>

      <section className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--text-primary)]">
            Nové účty
          </h2>
          <span className="text-xs text-[var(--text-muted)]">
            {stats.signupyCelkem === 0
              ? 'za 30 dní nikdo nový'
              : `${stats.signupyCelkem} za 30 dní`}
          </span>
        </div>

        {/* Prázdný graf je jen pruh nul přes celou šířku — když se za měsíc
            nikdo nepřipojil, řekne se to větou. */}
        {stats.signupyCelkem === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Za posledních {DNU_ZPET} dní se nepřipojil žádný nový účet. Nové vznikají PINem
            z tábora nebo registrací na webu.
          </p>
        ) : (
          <>
        <div className="flex h-28 items-end gap-[3px]" role="img" aria-label={`Nové účty po dnech, celkem ${stats.signupyCelkem} za ${DNU_ZPET} dní`}>
          {stats.dny.map(({ klic, datum, pocet }) => (
            <div
              key={klic}
              className="group relative flex-1"
              title={`${formatDen.format(datum)} — ${pocet} ${pocet === 1 ? 'účet' : pocet >= 2 && pocet <= 4 ? 'účty' : 'účtů'}`}
            >
              <div
                className={`w-full rounded-t transition-colors ${
                  pocet > 0
                    ? 'bg-[var(--color-primary)] group-hover:bg-[var(--color-primary)]/80'
                    : 'bg-[var(--bg-surface-hover)]'
                }`}
                style={{ height: pocet > 0 ? `${Math.max(8, (pocet / maximum) * 100)}%` : '3px' }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-[var(--text-muted)]">
          <span>{formatDen.format(stats.dny[0]!.datum)}</span>
          <span>dnes</span>
        </div>
          </>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4">
          <h2 className="font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--text-primary)]">
            Nejčastěji dokončené úkoly
          </h2>
          <span className="text-xs text-[var(--text-muted)]">7 dní</span>
        </div>
        {stats.topTasks.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-[var(--text-muted)]">
            Za posledních 7 dní nikdo nedokončil žádný úkol.
          </p>
        ) : (
          <ol className="divide-y divide-[var(--border-default)] border-t border-[var(--border-default)]">
            {stats.topTasks.map(([taskId, count], i) => (
              <li key={taskId} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                <span className="w-5 shrink-0 text-[var(--text-muted)]">{i + 1}.</span>
                <span className="flex-1 truncate font-mono text-xs text-[var(--text-secondary)]" title={taskId}>
                  {taskId}
                </span>
                <span className="font-semibold tabular-nums text-[var(--text-primary)]">{count}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
