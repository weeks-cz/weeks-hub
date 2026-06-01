'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Kanban, Calendar, Tent, FileText, BarChart3, Shield, ClipboardList, User, X, LogOut, Package } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/utils/roles';
import { NAV_ITEMS, ROUTES, APP_NAME } from '@/lib/utils/constants';

const ICONS = {
  LayoutDashboard,
  Kanban,
  Calendar,
  Tent,
  Package,
  FileText,
  BarChart3,
} as const;

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-[280px] bg-[var(--bg-surface)] border-r border-[var(--border-default)] z-50 lg:hidden animate-slide-down">
        <div className="flex items-center justify-between px-6 h-16 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-3">
            <Image src="/weeks-logo.png" alt="Weeks" width={32} height={32} className="rounded-lg" />
            <span className="text-lg font-semibold text-gradient font-[family-name:var(--font-heading)]">
              {APP_NAME}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.icon];
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}

          {/* Admin link */}
          {isAdmin(user?.role) && (
            <>
              <div className="mx-3 my-2 border-t border-[var(--border-default)]" />
              <Link
                href={ROUTES.registrace}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
                  pathname.startsWith(ROUTES.registrace)
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                )}
              >
                <ClipboardList className="w-5 h-5" />
                Registrace
              </Link>
              <Link
                href={ROUTES.admin}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
                  pathname.startsWith(ROUTES.admin)
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                )}
              >
                <Shield className="w-5 h-5" />
                Admin
              </Link>
            </>
          )}
        </nav>

        <div className="border-t border-[var(--border-default)] p-3 space-y-1 absolute bottom-0 left-0 right-0">
          <Link
            href={ROUTES.profile}
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors duration-150"
          >
            {(user?.custom_avatar_url || user?.avatar_url) ? (
              <img src={user.custom_avatar_url || user.avatar_url!} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <User className="w-5 h-5" />
            )}
            <span className="truncate">{user?.full_name || 'Profil'}</span>
          </Link>
          <button
            onClick={() => { onClose(); signOut(); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors duration-150 w-full"
          >
            <LogOut className="w-5 h-5" />
            Odhlásit se
          </button>
        </div>
      </div>
    </>
  );
}
