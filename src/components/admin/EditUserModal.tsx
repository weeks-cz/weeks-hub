'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { createClient } from '@/lib/supabase/client';
import { canManageRoles } from '@/lib/utils/roles';
import { ROLE_CONFIG, type User, type UserRole } from '@/types/database';

interface EditUserModalProps {
  targetUser: User;
  currentUser: User;
  onClose: () => void;
}

export function EditUserModal({ targetUser, currentUser, onClose }: EditUserModalProps) {
  const [fullName, setFullName] = useState(targetUser.full_name);
  const [position, setPosition] = useState(targetUser.position || '');
  const [phone, setPhone] = useState(targetUser.phone || '');
  const [bio, setBio] = useState(targetUser.bio || '');
  const [role, setRole] = useState<UserRole>(targetUser.role);
  const [isSaving, setIsSaving] = useState(false);

  const canChangeRole = canManageRoles(currentUser.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const supabase = createClient();
    const updates: Record<string, unknown> = {
      full_name: fullName.trim(),
      position: position.trim() || null,
      phone: phone.trim() || null,
      bio: bio.trim() || null,
    };

    if (canChangeRole) {
      updates.role = role;
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', targetUser.id);

    if (error) {
      toast.error('Nepodařilo se uložit');
    } else {
      toast.success(`Profil ${fullName.trim()} uložen`);
      onClose();
      window.location.reload();
    }

    setIsSaving(false);
  };

  return (
    <Modal isOpen onClose={onClose} title={`Upravit: ${targetUser.full_name}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Avatar src={targetUser.avatar_url} customSrc={targetUser.custom_avatar_url} name={targetUser.full_name} size="md" />
          <p className="text-sm text-[var(--text-muted)]">{targetUser.email}</p>
        </div>

        <Input
          label="Celé jméno"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <Input
          label="Pozice"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="Např. Marketing Manager"
        />

        <Input
          label="Telefon"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+420..."
        />

        <Textarea
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Něco o uživateli..."
          rows={2}
        />

        {canChangeRole && (
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Role
            </label>
            <div className="flex gap-2">
              {(Object.keys(ROLE_CONFIG) as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    role === r
                      ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30'
                      : 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border border-transparent hover:border-[var(--border-default)]'
                  }`}
                >
                  {ROLE_CONFIG[r].label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Uložit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
