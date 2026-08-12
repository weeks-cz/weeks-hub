'use client';

import { motion } from 'framer-motion';
import {
  Users,
  Eye,
  Clock,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  MousePointerClick,
  DollarSign,
  Target,
  MousePointer,
  Megaphone,
  BarChart3,
  Globe,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  ComposedChart,
} from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useRegistrations } from '@/hooks/useRegistrations';
import { EkonomikaPanel } from '@/components/analytics/EkonomikaPanel';
import { useMetaCampaigns, MetaCampaignsData } from '@/hooks/useMetaCampaigns';
import { StatsCardsSkeleton, TaskListSkeleton } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/ui/PageHeader';

const EVENT_LABELS: Record<string, string> = {
  registration_click: 'Klik na registraci',
  interest_submit: 'Odeslání zájmu',
  waitlist_submit: 'Zápis na waitlist',
  view_oneday_camp: 'Zobrazení jednodenního tábora',
};

const EVENT_COLORS: Record<string, string> = {
  registration_click: 'var(--color-primary)',
  interest_submit: 'var(--color-cta)',
  waitlist_submit: 'var(--color-accent)',
  view_oneday_camp: 'var(--color-trust)',
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const formatCZK = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' });
const formatNumber = new Intl.NumberFormat('cs-CZ');
const formatPercent = (v: number) => `${v.toFixed(2)} %`;

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktivn\u00ed',
  PAUSED: 'Pozastaven\u00e1',
  ARCHIVED: 'Archivovan\u00e1',
  DELETED: 'Smazan\u00e1',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-500/15 text-green-400',
  PAUSED: 'bg-amber-500/15 text-amber-400',
  ARCHIVED: 'bg-gray-500/15 text-gray-400',
  DELETED: 'bg-gray-500/15 text-gray-400',
};

/**
 * Změna proti předchozímu období.
 *
 * Šipka ukazuje, kam se číslo hnulo, barva jestli je to dobře. Dřív dělalo
 * obojí jedno: u míry opuštění nebo CPC se při poklesu kreslila šipka NAHORU,
 * protože se do komponenty poslala už otočená hodnota. Zelená byla správně,
 * šipka lhala.
 */
function TrendIndicator({ value, lepsiJeMene }: { value: number; lepsiJeMene?: boolean }) {
  if (value === 0) return null;
  const roste = value > 0;
  const Icon = roste ? TrendingUp : TrendingDown;
  const dobre = lepsiJeMene ? !roste : roste;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        dobre ? 'text-green-400' : 'text-red-400'
      }`}
      title={`${roste ? 'Nárůst' : 'Pokles'} o ${Math.abs(value)} % proti předchozímu období`}
    >
      <Icon className="w-3 h-3" aria-hidden />
      {Math.abs(value)}%
    </span>
  );
}

function MetaSection({ data, loading, error }: { data: MetaCampaignsData | null; loading: boolean; error: string | null }) {
  const isSetupError = error?.includes('META_ACCESS_TOKEN') || error?.includes('nakonfigurov');

  if (!loading && error) {
    if (isSetupError) {
      return (
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#1877F2]/10 flex items-center justify-center mx-auto">
            <Megaphone className="w-6 h-6 text-[#1877F2]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
            Nastavení Meta Ads
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Pro zobrazení Meta kampaní je potřeba nastavit proměnné prostředí META_ACCESS_TOKEN a META_AD_ACCOUNT_ID.
          </p>
          <div className="text-left bg-[var(--bg-primary)] rounded-xl p-4 text-xs text-[var(--text-secondary)] font-mono space-y-1 max-w-md mx-auto">
            <p>META_ACCESS_TOKEN=EAAxxxxxx...</p>
            <p>META_AD_ACCOUNT_ID=act_123456789</p>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Meta Overview Cards */}
      {loading ? (
        <StatsCardsSkeleton />
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'Útrata',
              value: formatCZK.format(data.overview.spend),
              change: data.overview.changes.spend,
              icon: DollarSign,
              color: '#1877F2',
              invertTrend: true,
            },
            {
              label: 'Dosah',
              value: formatNumber.format(data.overview.reach),
              change: data.overview.changes.reach,
              icon: Target,
              color: 'var(--color-trust)',
            },
            {
              label: 'Prokliky',
              value: formatNumber.format(data.overview.clicks),
              change: data.overview.changes.clicks,
              icon: MousePointer,
              color: 'var(--color-cta)',
            },
            {
              label: 'CPC',
              value: formatCZK.format(data.overview.cpc),
              change: data.overview.changes.cpc,
              icon: MousePointerClick,
              color: 'var(--color-accent)',
              invertTrend: true,
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4 hover:border-[#1877F2]/20 transition-colors duration-300"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
                        {stat.value}
                      </p>
                      <TrendIndicator value={stat.change} lepsiJeMene={stat.invertTrend} />
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : null}

      {/* Daily Spend Chart */}
      {loading ? (
        <TaskListSkeleton />
      ) : data && data.dailySpend.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-5"
        >
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 font-[family-name:var(--font-heading)]">
            Denní útrata za reklamu (30 dní)
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.dailySpend}>
                <defs>
                  <linearGradient id="colorMetaSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1877F2" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1877F2" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="spend"
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v} Kč`}
                />
                <YAxis
                  yAxisId="impressions"
                  orientation="right"
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value, name) => {
                    const v = Number(value);
                    if (name === 'Útrata') return [formatCZK.format(v), name];
                    return [formatNumber.format(v), name];
                  }}
                />
                <Bar
                  yAxisId="spend"
                  dataKey="spend"
                  name="Útrata"
                  fill="url(#colorMetaSpend)"
                  stroke="#1877F2"
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="impressions"
                  type="monotone"
                  dataKey="impressions"
                  name="Zobrazení"
                  stroke="var(--color-cta)"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      ) : null}

      {/* Campaigns Table */}
      {loading ? (
        <TaskListSkeleton />
      ) : data ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
          className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-5"
        >
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
              Přehled kampaní
            </h3>
            {/* Řádky kampaní chodí z Meta API za celou dobu běhu. Bez tohohle
                popisku se sčítaly s kartami nahoře, které jsou za 7 dní. */}
            <span className="text-xs text-[var(--text-muted)]">Za celou dobu běhu kampaně</span>
          </div>
          {data.campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--text-muted)] border-b border-[var(--border-default)]">
                    <th className="pb-3 pr-4 font-medium">Název</th>
                    <th className="pb-3 pr-4 font-medium">Stav</th>
                    <th className="pb-3 pr-4 font-medium text-right">Útrata</th>
                    <th className="pb-3 pr-4 font-medium text-right">Dosah</th>
                    <th className="pb-3 pr-4 font-medium text-right">Prokliky</th>
                    <th className="pb-3 pr-4 font-medium text-right">CPC</th>
                    <th className="pb-3 font-medium text-right">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.map((campaign, i) => (
                    <tr
                      key={campaign.id}
                      className={`border-b border-[var(--border-default)]/50 ${
                        i % 2 === 0 ? '' : 'bg-[var(--bg-primary)]/30'
                      }`}
                    >
                      <td className="py-3 pr-4">
                        <span className="text-[var(--text-secondary)] font-medium truncate block max-w-[220px]" title={campaign.name}>
                          {campaign.name}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[campaign.status] || 'bg-gray-500/15 text-gray-400'
                          }`}
                        >
                          {STATUS_LABELS[campaign.status] || campaign.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right text-[var(--text-primary)] font-medium tabular-nums">
                        {formatCZK.format(campaign.spend)}
                      </td>
                      <td className="py-3 pr-4 text-right text-[var(--text-secondary)] tabular-nums">
                        {formatNumber.format(campaign.reach)}
                      </td>
                      <td className="py-3 pr-4 text-right text-[var(--text-secondary)] tabular-nums">
                        {formatNumber.format(campaign.clicks)}
                      </td>
                      <td className="py-3 pr-4 text-right text-[var(--text-secondary)] tabular-nums">
                        {formatCZK.format(campaign.cpc)}
                      </td>
                      <td className="py-3 text-right text-[var(--text-secondary)] tabular-nums">
                        {formatPercent(campaign.ctr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">
              Žádné kampaně k zobrazení
            </p>
          )}
        </motion.div>
      ) : null}
    </>
  );
}

/**
 * Google Analytics se nenačetlo.
 *
 * Dřív se tenhle stav vracel místo celé stránky, takže výpadek GA schoval
 * i Meta kampaně, které s ním nemají nic společného. Teď zabírá jen místo
 * po blocích, které na GA opravdu stojí.
 */
function GaChyba({ error, onRefetch }: { error: string; onRefetch: () => void }) {
  const jeNastaveni = error.includes('GA4_PROPERTY_ID') || error.includes('credentials');
  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6 text-[var(--color-primary)]" />
      </div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
        {jeNastaveni ? 'Nastavení Google Analytics' : 'Návštěvnost se nenačetla'}
      </h2>
      <p className="text-sm text-[var(--text-muted)]">
        {jeNastaveni
          ? 'Pro zobrazení návštěvnosti je potřeba nastavit proměnné prostředí GA4_PROPERTY_ID, GOOGLE_CLIENT_EMAIL a GOOGLE_PRIVATE_KEY.'
          : error}
      </p>
      {jeNastaveni ? (
        <div className="text-left bg-[var(--bg-primary)] rounded-xl p-4 text-xs text-[var(--text-secondary)] font-mono space-y-1 max-w-md mx-auto">
          <p>GA4_PROPERTY_ID=123456789</p>
          <p>GOOGLE_CLIENT_EMAIL=...@...iam.gserviceaccount.com</p>
          <p>GOOGLE_PRIVATE_KEY=&quot;-----BEGIN PRIVATE KEY-----\\n...&quot;</p>
        </div>
      ) : (
        <button
          onClick={onRefetch}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <RefreshCw className="w-4 h-4" />
          Zkusit znovu
        </button>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, loading, error, refetch } = useAnalytics();
  const { data: metaData, loading: metaLoading, error: metaError } = useMetaCampaigns();
  // Registrace zná jen admin — ostatním se ekonomika ukáže bez tržeb.
  const { registrations, error: registraceError } = useRegistrations();

  const gaChyba = !loading && error ? error : null;

  return (
    <div className="space-y-6 relative">
      {/* Decorative blobs */}
      <PageHeader
        icon={BarChart3}
        title="Analytika"
        subtitle="Návštěvnost weeks.cz a výkon reklamy"
        actions={
          <button
            onClick={refetch}
            disabled={loading}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors disabled:opacity-50"
            title="Obnovit data"
            aria-label="Obnovit data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <EkonomikaPanel
        meta={metaData}
        registrations={registrations}
        bezRegistraci={!!registraceError}
      />

      {gaChyba ? (
        <GaChyba error={gaChyba} onRefetch={refetch} />
      ) : (
        <>
        {/* Stejny tvar hlavicky jako u Meta kampani nize — stranka ma dve
            sekce a je poznat, kde jedna konci. Perioda patri sem, protoze
            API micha 7denni karty s 30dennimi grafy. */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] text-[var(--text-primary)]">
              Návštěvnost webu
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Google Analytics — karty za 7 dní, grafy níže za 30
            </p>
          </div>
        </div>

        {loading ? (
          <StatsCardsSkeleton />
        ) : data ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: 'Uživatelé',
                value: data.overview.totalUsers.toLocaleString('cs-CZ'),
                change: data.overview.changes.users,
                icon: Users,
                color: 'var(--color-primary)',
              },
              {
                label: 'Zobrazení stránek',
                value: data.overview.totalPageviews.toLocaleString('cs-CZ'),
                change: data.overview.changes.pageviews,
                icon: Eye,
                color: 'var(--color-cta)',
              },
              {
                label: 'Prům. doba relace',
                value: formatDuration(data.overview.avgSessionDuration),
                change: data.overview.changes.duration,
                icon: Clock,
                color: 'var(--color-trust)',
              },
              {
                label: 'Míra opuštění',
                value: `${data.overview.bounceRate}%`,
                change: data.overview.changes.bounceRate,
                icon: ArrowDownRight,
                color: 'var(--color-accent)',
                invertTrend: true,
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                  className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4 hover:border-[var(--color-primary)]/20 transition-colors duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${stat.color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
                          {stat.value}
                        </p>
                        <TrendIndicator value={stat.change} lepsiJeMene={stat.invertTrend} />
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : null}

        {/* Daily Visitors Chart */}
        {loading ? (
          <TaskListSkeleton />
        ) : data ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-5"
          >
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
                Denní návštěvnost
              </h3>
              <span className="text-xs text-[var(--text-muted)]">30 dní</span>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyVisitors}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-cta)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--color-cta)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    name="Uživatelé"
                    stroke="var(--color-primary)"
                    fill="url(#colorUsers)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="pageviews"
                    name="Zobrazení"
                    stroke="var(--color-cta)"
                    fill="url(#colorPageviews)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ) : null}

        {/* Two columns: Top Pages + Traffic Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Pages */}
          {loading ? (
            <TaskListSkeleton />
          ) : data ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.45 }}
              className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-5"
            >
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
                  Nejnavštěvovanější stránky
                </h3>
                <span className="text-xs text-[var(--text-muted)]">30 dní</span>
              </div>
              <div className="space-y-2">
                {data.topPages.map((page, i) => {
                  const maxViews = data.topPages[0]?.views || 1;
                  const width = (page.views / maxViews) * 100;
                  return (
                    <div key={i} className="group">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[var(--text-secondary)] truncate max-w-[60%]" title={page.page}>
                          {page.page}
                        </span>
                        <span className="text-[var(--text-muted)] flex gap-3">
                          <span>{page.views.toLocaleString('cs-CZ')} zobrazení</span>
                          <span>{page.users.toLocaleString('cs-CZ')} uživatelů</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {data.topPages.length === 0 && (
                  <p className="text-sm text-[var(--text-muted)] text-center py-4">
                    Žádná data
                  </p>
                )}
              </div>
            </motion.div>
          ) : null}

          {/* Traffic Sources */}
          {loading ? (
            <TaskListSkeleton />
          ) : data ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-5"
            >
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
                  Zdroje návštěvnosti
                </h3>
                <span className="text-xs text-[var(--text-muted)]">30 dní</span>
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.trafficSources}
                    layout="vertical"
                    margin={{ left: 0, right: 20 }}
                  >
                    <XAxis
                      type="number"
                      stroke="var(--text-muted)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="source"
                      stroke="var(--text-muted)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Bar
                      dataKey="users"
                      name="Uživatelé"
                      fill="var(--color-primary)"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {data.trafficSources.length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">
                  Žádná data
                </p>
              )}
            </motion.div>
          ) : null}
        </div>

        {/* Key Events */}
        {loading ? (
          <TaskListSkeleton />
        ) : data ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.55 }}
            className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-5"
          >
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
                Klíčové události
              </h3>
              <span className="text-xs text-[var(--text-muted)]">30 dní</span>
            </div>
            {data.keyEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {data.keyEvents.map((event) => {
                  const color = EVENT_COLORS[event.event] || 'var(--color-primary)';
                  const label = EVENT_LABELS[event.event] || event.event;
                  return (
                    <div
                      key={event.event}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)]"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <MousePointerClick className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
                          {event.count.toLocaleString('cs-CZ')}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">
                Žádné klíčové události za toto období
              </p>
            )}
          </motion.div>
        ) : null}
        </>
      )}

      {/* Divider between GA and Meta sections */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-default)]" />
        </div>
      </div>

      {/* Meta Campaigns Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1877F2]/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-[#1877F2]" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] text-[var(--text-primary)]">
              Meta Kampaně
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Facebook & Instagram Ads — posledních 7 dní vs. předchozí období
            </p>
          </div>
        </div>

        <MetaSection data={metaData} loading={metaLoading} error={metaError} />
      </div>
    </div>
  );
}
