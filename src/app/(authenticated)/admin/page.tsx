'use client';

import Link from 'next/link';
import { Users, Tent, FileText, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { useCamps } from '@/hooks/useCamps';
import { useFormSubmissions } from '@/hooks/useFormSubmissions';
import { isAdmin } from '@/lib/utils/roles';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { ROLE_CONFIG } from '@/types/database';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const { camps, loading: campsLoading } = useCamps();
  const { submissions, newCount, loading: submissionsLoading } = useFormSubmissions();

  if (authLoading) return <LoadingPage />;
  if (!user || !isAdmin(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-[var(--text-muted)]">Nemáš oprávnění pro tuto sekci.</p>
      </div>
    );
  }

  const loading = usersLoading || campsLoading || submissionsLoading;

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    {
      label: 'Uživatelé',
      value: users.length,
      icon: Users,
      color: 'var(--color-primary)',
      href: '/admin/users',
      detail: Object.entries(roleCounts).map(([role, count]) => `${count} ${ROLE_CONFIG[role as keyof typeof ROLE_CONFIG]?.label || role}`).join(', '),
    },
    {
      label: 'Tábory',
      value: camps.length,
      icon: Tent,
      color: 'var(--color-trust)',
      href: '/camps',
      detail: `${camps.filter(c => c.status !== 'closed').length} aktivních`,
    },
    {
      label: 'Formuláře',
      value: submissions.length,
      icon: FileText,
      color: 'var(--color-cta)',
      href: '/formulare',
      detail: newCount > 0 ? `${newCount} nových` : 'Vše zpracováno',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/15 flex items-center justify-center">
          <Shield className="w-5 h-5 text-[var(--color-primary)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
            Administrace
          </h2>
          <p className="text-sm text-[var(--text-muted)]">Správa uživatelů a přehled systému</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-6 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface-hover)] mb-4" />
              <div className="h-8 w-16 bg-[var(--bg-surface-hover)] rounded mb-2" />
              <div className="h-4 w-24 bg-[var(--bg-surface-hover)] rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-6 hover:border-[var(--color-primary)]/30 transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <p className="text-3xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
                  {stat.value}
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{stat.label}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{stat.detail}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
