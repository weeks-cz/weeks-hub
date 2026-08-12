'use client';

import Link from 'next/link';
import { Users, Shield, GraduationCap, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { isAdmin } from '@/lib/utils/roles';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { NemasOpravneni } from '@/components/ui/NemasOpravneni';
import { PageHeader } from '@/components/ui/PageHeader';
import { ROLE_CONFIG } from '@/types/database';
import type { UserRole } from '@/types/database';

/** Od nejsilnější role po nejslabší — v tomhle pořadí se vypisují. */
const PORADI_ROLI: UserRole[] = ['developer', 'admin', 'member'];

const NASTROJE = [
  {
    href: '/admin/users',
    icon: Users,
    title: 'Správa uživatelů',
    popis: 'Role, profily a odebrání přístupu',
  },
  {
    href: '/admin/learning',
    icon: GraduationCap,
    title: 'Learning',
    popis: 'Účty a aktivita ve výukové aplikaci',
  },
];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { users, loading: usersLoading } = useUsers();

  if (authLoading) return <LoadingPage />;
  if (!user || !isAdmin(user.role)) return <NemasOpravneni sekce="Administrace" />;

  const podleRole = PORADI_ROLI.map((role) => ({
    role,
    lide: users.filter((u) => u.role === role),
  })).filter((skupina) => skupina.lide.length > 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        icon={Shield}
        title="Administrace"
        subtitle="Kdo má do hubu přístup a s jakými právy"
      />

      {/* Dřív tu byly dlaždice s počtem táborů a formulářů — tatáž čísla, jaká
          jsou na dashboardu i v levém menu. Zbylo to, co jinde není: kdo je
          uvnitř. */}
      <section className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--text-primary)]">
            Přístupy
          </h2>
          <Link
            href="/admin/users"
            className="text-xs font-medium text-[var(--color-primary)] hover:underline"
          >
            Spravovat
          </Link>
        </div>

        {usersLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--bg-surface-hover)]" />
            ))}
          </div>
        ) : podleRole.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Zatím tu není žádný účet.</p>
        ) : (
          <div className="space-y-4">
            {podleRole.map(({ role, lide }) => (
              <div key={role}>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${ROLE_CONFIG[role].color}20`,
                      color: ROLE_CONFIG[role].color,
                    }}
                  >
                    {ROLE_CONFIG[role].label}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {lide.length} {lide.length === 1 ? 'účet' : lide.length <= 4 ? 'účty' : 'účtů'}
                  </span>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {lide.map((u) => (
                    <li
                      key={u.id}
                      className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-1.5 text-sm text-[var(--text-secondary)]"
                      title={u.email}
                    >
                      {u.full_name || u.email}
                      {u.id === user.id && (
                        <span className="ml-1.5 text-xs text-[var(--text-muted)]">(ty)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {NASTROJE.map(({ href, icon: Icon, title, popis }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-colors hover:border-[var(--color-primary)]/30"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
              <Icon className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <p className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
              {title}
              <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" />
            </p>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">{popis}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
