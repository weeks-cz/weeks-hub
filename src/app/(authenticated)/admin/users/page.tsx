'use client';

import { useState } from 'react';
import { Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { isAdmin } from '@/lib/utils/roles';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { UserTable } from '@/components/admin/UserTable';
import { EditUserModal } from '@/components/admin/EditUserModal';
import type { User } from '@/types/database';

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filter, setFilter] = useState('');

  if (authLoading || usersLoading) return <LoadingPage />;
  if (!user || !isAdmin(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-[var(--text-muted)]">Nemáš oprávnění pro tuto sekci.</p>
      </div>
    );
  }

  const filteredUsers = users.filter((u) =>
    u.full_name.toLowerCase().includes(filter.toLowerCase()) ||
    u.email.toLowerCase().includes(filter.toLowerCase()) ||
    u.role.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/15 flex items-center justify-center">
          <Shield className="w-5 h-5 text-[var(--color-primary)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
            Správa uživatelů
          </h2>
          <p className="text-sm text-[var(--text-muted)]">{users.length} uživatelů</p>
        </div>
      </div>

      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Hledat uživatele..."
        className="w-full px-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
      />

      <UserTable
        users={filteredUsers}
        currentUser={user}
        onEdit={setEditingUser}
      />

      {editingUser && (
        <EditUserModal
          targetUser={editingUser}
          currentUser={user}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}
