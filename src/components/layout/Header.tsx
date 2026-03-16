'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/layout/NotificationBell';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/board': 'Task Board',
  '/calendar': 'Kalendář',
  '/profile': 'Profil',
  '/profile/edit': 'Upravit profil',
  '/admin': 'Administrace',
  '/admin/users': 'Správa uživatelů',
};

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const title = PAGE_TITLES[pathname] ?? 'Weeks Hub';

  const avatarSrc = user?.custom_avatar_url || user?.avatar_url;

  return (
    <header className="h-16 bg-[var(--bg-surface)]/80 backdrop-blur-xl border-b border-[var(--border-default)] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        {user && (
          <div className="flex items-center gap-2 ml-1">
            <span className="text-sm text-[var(--text-secondary)] hidden sm:block">
              {user.full_name}
            </span>
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={user.full_name}
                className="w-8 h-8 rounded-full border-2 border-[var(--border-default)] object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-xs font-medium text-white">
                {user.full_name?.charAt(0) || '?'}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
