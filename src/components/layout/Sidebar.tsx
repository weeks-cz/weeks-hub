'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Kanban, Calendar, Tent, FileText, BarChart3, Shield, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/utils/roles';
import { NAV_ITEMS, ROUTES, APP_NAME } from '@/lib/utils/constants';

const ICONS = {
  LayoutDashboard,
  Kanban,
  Calendar,
  Tent,
  FileText,
  BarChart3,
} as const;

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-[260px] h-screen bg-[var(--bg-surface)] border-r border-[var(--border-default)] fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-[var(--border-default)] bg-gradient-to-r from-[var(--color-primary)]/5 to-transparent">
        <Image src="/weeks-logo.png" alt="Weeks" width={36} height={36} className="rounded-lg" />
        <span className="text-lg font-semibold text-gradient font-[family-name:var(--font-heading)]">
          {APP_NAME}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-[var(--color-primary)]/10"
                  transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                />
              )}
              <Icon className="w-5 h-5 relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}

        {/* Admin link — only for admin/developer */}
        {isAdmin(user?.role) && (
          <>
            <div className="mx-3 my-2 border-t border-[var(--border-default)]" />
            <Link
              href={ROUTES.admin}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                pathname.startsWith(ROUTES.admin)
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              )}
            >
              {pathname.startsWith(ROUTES.admin) && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-[var(--color-primary)]/10"
                  transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                />
              )}
              <Shield className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Admin</span>
            </Link>
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className="border-t border-[var(--border-default)] p-3 space-y-1">
        <Link
          href={ROUTES.profile}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            pathname.startsWith(ROUTES.profile)
              ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
          )}
        >
          {(user?.custom_avatar_url || user?.avatar_url) ? (
            <img src={user.custom_avatar_url || user.avatar_url!} alt="" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <User className="w-5 h-5" />
          )}
          <span className="truncate">{user?.full_name || 'Profil'}</span>
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all duration-200 w-full"
        >
          <LogOut className="w-5 h-5" />
          Odhlásit se
        </button>
      </div>
    </aside>
  );
}
