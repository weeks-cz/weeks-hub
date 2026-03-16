'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { LoadingPage } from '@/components/ui/LoadingSpinner';

export default function ProfileEditPage() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [position, setPosition] = useState(user?.position || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [favoriteSport, setFavoriteSport] = useState(user?.favorite_sport || '');
  const [favoriteColor, setFavoriteColor] = useState(user?.favorite_color || '');
  const [favoriteFood, setFavoriteFood] = useState(user?.favorite_food || '');
  const [motto, setMotto] = useState(user?.motto || '');
  const [customAvatarUrl, setCustomAvatarUrl] = useState(user?.custom_avatar_url || null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const hasChanges = useCallback(() => {
    if (!user) return false;
    return (
      fullName !== (user.full_name || '') ||
      bio !== (user.bio || '') ||
      position !== (user.position || '') ||
      phone !== (user.phone || '') ||
      favoriteSport !== (user.favorite_sport || '') ||
      favoriteColor !== (user.favorite_color || '') ||
      favoriteFood !== (user.favorite_food || '') ||
      motto !== (user.motto || '')
    );
  }, [fullName, bio, position, phone, favoriteSport, favoriteColor, favoriteFood, motto, user]);

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
    const updates = {
      full_name: fullName.trim(),
      bio: bio.trim() || null,
      position: position.trim() || null,
      phone: phone.trim() || null,
      favorite_sport: favoriteSport.trim() || null,
      favorite_color: favoriteColor.trim() || null,
      favorite_food: favoriteFood.trim() || null,
      motto: motto.trim() || null,
    };

    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (updateError) {
      setError('Nepodařilo se uložit profil');
      toast.error('Nepodařilo se uložit profil');
      setIsSaving(false);
    } else {
      updateUser({ ...updates, custom_avatar_url: customAvatarUrl });
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
        <h2 className="text-lg font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)] mb-1">
          Upravit profil
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">{user.email}</p>

        {/* Avatar upload */}
        <div className="mb-6">
          <AvatarUpload
            userId={user.id}
            currentAvatarUrl={user.avatar_url}
            customAvatarUrl={customAvatarUrl}
            name={user.full_name}
            onUploaded={(url) => setCustomAvatarUrl(url)}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <div className="space-y-4">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Základní údaje</p>
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
              placeholder="Něco o sobě..."
              rows={3}
            />
          </div>

          {/* Fun fields */}
          <div className="space-y-4">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">O mně</p>
            <Input
              label="Oblíbený sport"
              value={favoriteSport}
              onChange={(e) => setFavoriteSport(e.target.value)}
              placeholder="Např. fotbal, plavání..."
            />
            <Input
              label="Oblíbená barva"
              value={favoriteColor}
              onChange={(e) => setFavoriteColor(e.target.value)}
              placeholder="Např. modrá"
            />
            <Input
              label="Oblíbené jídlo"
              value={favoriteFood}
              onChange={(e) => setFavoriteFood(e.target.value)}
              placeholder="Např. pizza, sushi..."
            />
            <Input
              label="Motto"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="Tvůj oblíbený citát..."
            />
          </div>

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
