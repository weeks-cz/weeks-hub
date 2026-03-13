'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Kanban, Calendar, Tent, FileText, User, X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/contexts/AuthContext';
import { NAV_ITEMS, ROUTES, APP_NAME } from '@/lib/utils/constants';

const ICONS = {
  LayoutDashboard,
  Kanban,
  Calendar,
  Tent,
  FileText,
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
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
              <span className="text-sm font-bold text-white font-[family-name:var(--font-heading)]">W</span>
            </div>
            <span className="text-lg font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
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
        </nav>

        <div className="border-t border-[var(--border-default)] p-3 space-y-1 absolute bottom-0 left-0 right-0">
          <Link
            href={ROUTES.profile}
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors duration-150"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full" />
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
