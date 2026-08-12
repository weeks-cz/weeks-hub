'use client';

import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { isAdmin } from '@/lib/utils/roles';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { NemasOpravneni } from '@/components/ui/NemasOpravneni';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { obsahuje } from '@/lib/utils/text';
import { UserTable } from '@/components/admin/UserTable';
import { EditUserModal } from '@/components/admin/EditUserModal';
import { ROLE_CONFIG } from '@/types/database';
import type { User } from '@/types/database';

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [hledani, setHledani] = useState('');

  const nalezeni = useMemo(() => {
    const dotaz = hledani.trim();
    if (!dotaz) return users;
    // Hledá se i podle role, ale česky: kdo píše „člen", nechce hledat "member".
    return users.filter((u) =>
      obsahuje([u.full_name, u.email, u.position, ROLE_CONFIG[u.role]?.label].filter(Boolean).join(' '), dotaz),
    );
  }, [users, hledani]);

  if (authLoading || usersLoading) return <LoadingPage />;
  if (!user || !isAdmin(user.role)) return <NemasOpravneni sekce="Správa uživatelů" />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        icon={Users}
        title="Správa uživatelů"
        subtitle={`${users.length} ${users.length === 1 ? 'účet' : users.length <= 4 ? 'účty' : 'účtů'} v hubu`}
      />

      <SearchInput
        value={hledani}
        onChange={setHledani}
        placeholder="Hledat podle jména, e-mailu nebo role…"
        label="Hledat uživatele"
      />

      {nalezeni.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-10 text-center">
          <p className="text-sm text-[var(--text-primary)]">Nikdo neodpovídá</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Hledá se ve jménu, e-mailu, pozici i roli — na diakritice nezáleží.
          </p>
        </div>
      ) : (
        <UserTable users={nalezeni} currentUser={user} onEdit={setEditingUser} />
      )}

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
