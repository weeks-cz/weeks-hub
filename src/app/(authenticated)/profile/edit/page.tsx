'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingPage } from '@/components/ui/LoadingSpinner';

export default function ProfileEditPage() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const hasChanges = useCallback(() => {
    if (!user) return false;
    return fullName !== (user.full_name || '') || bio !== (user.bio || '');
  }, [fullName, bio, user]);

  // Warn on browser close/refresh with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges()) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  if (loading) return <LoadingPage />;
  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name: fullName.trim(),
        bio: bio.trim() || null,
      })
      .eq('id', user.id);

    if (updateError) {
      setError('Nepodařilo se uložit profil');
      toast.error('Nepodařilo se uložit profil');
      setIsSaving(false);
    } else {
      updateUser({ full_name: fullName.trim(), bio: bio.trim() || null });
      toast.success('Profil uložen');
      router.push('/profile');
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      if (!window.confirm('Máš neuložené změny. Opravdu chceš odejít?')) {
        return;
      }
    }
    router.back();
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar src={user.avatar_url} name={user.full_name} size="lg" />
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
              Upravit profil
            </h2>
            <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Celé jméno"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Textarea
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Něco o sobě..."
            rows={3}
          />

          {error && (
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleCancel}>
              Zrušit
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Uložit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
