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
} from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Skeleton, StatsCardsSkeleton, TaskListSkeleton } from '@/components/ui/Skeleton';

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

function TrendIndicator({ value }: { value: number }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? 'text-green-400' : 'text-red-400'
      }`}
    >
      <Icon className="w-3 h-3" />
      {Math.abs(value)}%
    </span>
  );
}

export default function AnalyticsPage() {
  const { data, loading, error, refetch } = useAnalytics();

  // Setup / error state
  if (!loading && error) {
    const isSetupError = error.includes('GA4_PROPERTY_ID') || error.includes('credentials');
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-8 max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
            {isSetupError ? 'Nastavení Google Analytics' : 'Chyba'}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            {isSetupError
              ? 'Pro zobrazení analytiky je potřeba nastavit proměnné prostředí GA4_PROPERTY_ID, GOOGLE_CLIENT_EMAIL a GOOGLE_PRIVATE_KEY.'
              : error}
          </p>
          {isSetupError && (
            <div className="text-left bg-[var(--bg-primary)] rounded-xl p-4 text-xs text-[var(--text-secondary)] font-mono space-y-1">
              <p>GA4_PROPERTY_ID=123456789</p>
              <p>GOOGLE_CLIENT_EMAIL=...@...iam.gserviceaccount.com</p>
              <p>GOOGLE_PRIVATE_KEY=&quot;-----BEGIN PRIVATE KEY-----\n...&quot;</p>
            </div>
          )}
          {!isSetupError && (
            <button
              onClick={refetch}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              Zkusit znovu
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Decorative blobs */}
      <div className="blob blob-primary w-[300px] h-[300px] -top-32 -right-32" />
      <div className="blob blob-accent w-[200px] h-[200px] top-64 -left-24" />

      {/* Header */}
      <div className="flex items-center justify-between relative">
        <div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)]">
            <span className="text-gradient">Analytika</span>
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Přehled návštěvnosti weeks.cz za posledních 30 dní
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors disabled:opacity-50"
          title="Obnovit data"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Overview Stats */}
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
                      <TrendIndicator
                        value={stat.invertTrend ? -stat.change : stat.change}
                      />
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
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 font-[family-name:var(--font-heading)]">
            Denní návštěvnost
          </h3>
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
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 font-[family-name:var(--font-heading)]">
              Nejnavštěvovanější stránky
            </h3>
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
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 font-[family-name:var(--font-heading)]">
              Zdroje návštěvnosti
            </h3>
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
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 font-[family-name:var(--font-heading)]">
            Klíčové události
          </h3>
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
    </div>
  );
}
