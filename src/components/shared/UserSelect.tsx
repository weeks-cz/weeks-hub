'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/Avatar';
import type { User } from '@/types/database';

interface UserSelectProps {
  value: string | null;
  onChange: (userId: string | null) => void;
  label?: string;
  className?: string;
}

export function UserSelect({ value, onChange, label = 'Assignee', className }: UserSelectProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('users').select('*').order('full_name');
      if (data) setUsers(data);
    };
    fetchUsers();
  }, []);

  const selectedUser = users.find((u) => u.id === value);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl text-sm text-left focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        >
          {selectedUser ? (
            <>
              <Avatar src={selectedUser.avatar_url} name={selectedUser.full_name} size="sm" />
              <span className="text-[var(--text-primary)]">{selectedUser.full_name}</span>
            </>
          ) : (
            <span className="text-[var(--text-muted)]">Nepřiřazeno</span>
          )}
        </button>

        {isOpen && (
          <div className="absolute z-10 top-full mt-1 w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-lg overflow-hidden animate-fade-in">
            <button
              type="button"
              onClick={() => { onChange(null); setIsOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              Nepřiřazeno
            </button>
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => { onChange(user.id); setIsOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
                {user.full_name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
