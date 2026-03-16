'use client';

import { Edit, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ROLE_CONFIG, type User } from '@/types/database';
import { canDeleteUsers, canEditOtherProfiles } from '@/lib/utils/roles';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface UserTableProps {
  users: User[];
  currentUser: User;
  onEdit: (user: User) => void;
}

export function UserTable({ users, currentUser, onEdit }: UserTableProps) {
  const handleDelete = async (targetUser: User) => {
    if (targetUser.id === currentUser.id) {
      toast.error('Nemůžeš smazat svůj vlastní účet');
      return;
    }

    if (!window.confirm(`Opravdu chceš smazat uživatele ${targetUser.full_name}?`)) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('users').delete().eq('id', targetUser.id);

    if (error) {
      toast.error('Nepodařilo se smazat uživatele');
    } else {
      toast.success(`${targetUser.full_name} byl smazán`);
      window.location.reload();
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide px-4 py-3">Uživatel</th>
              <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Pozice</th>
              <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide px-4 py-3">Role</th>
              <th className="text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide px-4 py-3">Akce</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const roleConfig = ROLE_CONFIG[u.role];
              return (
                <tr key={u.id} className="border-b border-[var(--border-default)] last:border-b-0 hover:bg-[var(--bg-surface-hover)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar_url} customSrc={u.custom_avatar_url} name={u.full_name} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{u.full_name}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-sm text-[var(--text-secondary)]">{u.position || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={roleConfig.color}>{roleConfig.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {canEditOtherProfiles(currentUser.role) && u.id !== currentUser.id && (
                        <button
                          onClick={() => onEdit(u)}
                          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
                          title="Upravit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDeleteUsers(currentUser.role) && u.id !== currentUser.id && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
                          title="Smazat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
