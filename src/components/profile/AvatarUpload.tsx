'use client';

import { useState, useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/Avatar';
import toast from 'react-hot-toast';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  customAvatarUrl: string | null;
  name: string;
  onUploaded: (url: string | null) => void;
}

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function AvatarUpload({ userId, currentAvatarUrl, customAvatarUrl, name, onUploaded }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Povolené formáty: JPG, PNG, WebP');
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error('Maximální velikost: 2 MB');
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      toast.error(`Nahrávání selhalo: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);

    // Add cache buster to force refresh
    const urlWithBuster = `${publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from('users')
      .update({ custom_avatar_url: urlWithBuster })
      .eq('id', userId);

    if (updateError) {
      toast.error('Nepodařilo se uložit');
    } else {
      onUploaded(urlWithBuster);
      toast.success('Avatar nahrán');
    }

    setUploading(false);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = async () => {
    setUploading(true);
    const supabase = createClient();

    await supabase.storage.from('avatars').remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.webp`]);

    const { error } = await supabase
      .from('users')
      .update({ custom_avatar_url: null })
      .eq('id', userId);

    if (error) {
      toast.error('Nepodařilo se odebrat avatar');
    } else {
      onUploaded(null);
      toast.success('Avatar odebrán');
    }

    setUploading(false);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative group">
        <Avatar
          src={currentAvatarUrl}
          customSrc={customAvatarUrl}
          name={name}
          size="lg"
          className="!w-20 !h-20 text-2xl"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
        >
          <Camera className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="space-y-1">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors disabled:opacity-50"
        >
          {uploading ? 'Nahrávání...' : 'Nahrát obrázek'}
        </button>
        {customAvatarUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--color-error)] transition-colors disabled:opacity-50"
          >
            <X className="w-3 h-3" /> Odebrat
          </button>
        )}
        <p className="text-[10px] text-[var(--text-muted)]">JPG, PNG nebo WebP, max 2 MB</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
