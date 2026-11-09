import Link from 'next/link';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { createIotAdminClient } from '@/lib/supabase/iot-server';
import { jeAdmin } from '@/lib/auth/jeAdmin';
import { NemasOpravneni } from '@/components/ui/NemasOpravneni';
import { PageHeader } from '@/components/ui/PageHeader';
import { jeInterni } from '@/lib/utils/ucebna';

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

type Udalost = {
  type: string;
  props: { order?: number; lesson?: string } | null;
  parent_id: string | null;
  anon_id: string | null;
  created_at: string;
};

/**
 * Čte schéma učebny v2 (od 29. 8. 2026: parents / children / learning_events
 * s `type` a `props`). Do listopadu 2026 se tu ptalo na `learning_accounts`
 * a `event_type` z původní učebny — tabulky, které už neexistují, a protože se
 * chyba měnila na `?? 0`, stránka tři měsíce ukazovala nuly. Chyby se proto
 * teď vrací a stránka je ukáže.
 */
async function fetchStats() {
  const iot = createIotAdminClient();
  const pred7 = predDny(7).toISOString();
  const pred30 = predDny(DNU_ZPET).toISOString();

  const [parentsRes, childrenRes, eventsRes] = await Promise.all([
    iot.from('parents').select('id, email, created_at, onboarding_completed_at, utm_source'),
    iot.from('children').select('id', { count: 'exact', head: true }).is('archived_at', null),
    iot.from('learning_events')
       .select('type, props, parent_id, anon_id, created_at')
       .in('type', ['lesson_start', 'lesson_complete'])
       .gte('created_at', pred30)
       .limit(10000),
  ]);

  const chyby = [parentsRes.error, childrenRes.error, eventsRes.error]
    .filter(Boolean)
    .map((e) => e!.message);

  const rodice = (parentsRes.data ?? []).filter((p) => !jeInterni(p.email as string | null));
  const udalosti = (eventsRes.data ?? []) as Udalost[];
  const kdo = (u: Udalost) => u.parent_id ?? u.anon_id ?? '?';

  const posledni7 = udalosti.filter((u) => u.created_at >= pred7);
  const aktivni7 = new Set(posledni7.filter((u) => u.type === 'lesson_start').map(kdo));
  const dokonceno7 = posledni7.filter((u) => u.type === 'lesson_complete');

  // Hlavní metrika Brány 1: kolik z těch, kdo začali lekci 1, ji dokončilo
  // (včetně anonymních návštěvníků — jmenovatel bez nich nedává smysl).
  const lekce1 = (typ: string) =>
    new Set(udalosti.filter((u) => u.type === typ && Number(u.props?.order) === 1).map(kdo));
  const zacaloL1 = lekce1('lesson_start');
  const dokonciloL1 = [...lekce1('lesson_complete')].filter((k) => zacaloL1.has(k)).length;

  const podleDne: Record<string, number> = {};
  for (const p of rodice) {
    if ((p.created_at as string) < pred30) continue;
    const den = klicDne(new Date(p.created_at as string));
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
  for (const u of dokonceno7) {
    const lekce = u.props?.lesson;
    if (lekce) pocty[lekce] = (pocty[lekce] ?? 0) + 1;
  }
  const topTasks = Object.entries(pocty)
    .sort((a, b) => b[1]! - a[1]!)
    .slice(0, 10);

  return {
    chyby,
    totalAccounts: rodice.filter((p) => p.onboarding_completed_at).length,
    deti: childrenRes.count ?? 0,
    active7d: aktivni7.size,
    completes7d: dokonceno7.length,
    zKampane: rodice.filter((p) => p.utm_source).length,
    zacaloL1: zacaloL1.size,
    dokonciloL1,
    dny,
    signupyCelkem: Object.values(podleDne).reduce((a, b) => a + b, 0),
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

      {stats.chyby.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-error)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--color-error)]">
          Data z učebny se nepodařilo načíst celá, čísla níže mohou být neúplná: {stats.chyby.join(' · ')}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Registrovaní rodiče" value={stats.totalAccounts} popis="dokončený onboarding, bez týmu" />
        <StatCard label="Dětské profily" value={stats.deti} />
        <StatCard label="Z kampaně" value={stats.zKampane} popis="účty s UTM" />
        <StatCard label="Učilo se" value={stats.active7d} popis="za 7 dní, i bez účtu" />
        <StatCard label="Dokončených lekcí" value={stats.completes7d} popis="za 7 dní" />
        <StatCard
          label="Dokončili lekci 1"
          value={stats.dokonciloL1}
          popis={`z ${stats.zacaloL1} co začali (${DNU_ZPET} dní${
            stats.zacaloL1 ? `, ${Math.round((stats.dokonciloL1 / stats.zacaloL1) * 100)} %` : ''
          })`}
        />
      </div>

      <section className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--text-primary)]">
            Noví rodiče
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
            Za posledních {DNU_ZPET} dní nezaložil účet žádný nový rodič.
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
            Nejčastěji dokončené lekce
          </h2>
          <span className="text-xs text-[var(--text-muted)]">7 dní</span>
        </div>
        {stats.topTasks.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-[var(--text-muted)]">
            Za posledních 7 dní nikdo nedokončil žádnou lekci.
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
