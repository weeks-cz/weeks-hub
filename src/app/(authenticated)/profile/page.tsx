'use client';

import Link from 'next/link';
import { Edit, Mail, Shield, Phone, Heart, Palette, UtensilsCrossed, Quote } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { ROLE_CONFIG } from '@/types/database';

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingPage />;
  if (!user) return null;

  const roleConfig = ROLE_CONFIG[user.role];

  const funFields = [
    { icon: Heart, label: 'Oblíbený sport', value: user.favorite_sport },
    { icon: Palette, label: 'Oblíbená barva', value: user.favorite_color },
    { icon: UtensilsCrossed, label: 'Oblíbené jídlo', value: user.favorite_food },
    { icon: Quote, label: 'Motto', value: user.motto },
  ].filter((f) => f.value);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]" />

        {/* Profile info */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <Avatar
              src={user.avatar_url}
              customSrc={user.custom_avatar_url}
              name={user.full_name}
              size="lg"
              className="!w-24 !h-24 border-4 border-[var(--bg-surface)] text-2xl"
            />
            <Link href="/profile/edit">
              <Button variant="secondary" size="sm">
                <Edit className="w-4 h-4" />
                Upravit profil
              </Button>
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
            {user.full_name}
          </h2>

          {user.position && (
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">{user.position}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
              <Mail className="w-4 h-4" />
              {user.email}
            </div>
            {user.phone && (
              <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                <Phone className="w-4 h-4" />
                {user.phone}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm">
              <Shield className="w-4 h-4 text-[var(--text-muted)]" />
              <Badge color={roleConfig.color}>
                {roleConfig.label}
              </Badge>
            </div>
          </div>

          {user.bio && (
            <div className="mt-5 p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-default)]">
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Bio</label>
              <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{user.bio}</p>
            </div>
          )}

          {funFields.length > 0 && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {funFields.map((field) => {
                const Icon = field.icon;
                return (
                  <div
                    key={field.label}
                    className="flex items-center gap-3 p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-default)]"
                  >
                    <Icon className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">{field.label}</p>
                      <p className="text-sm text-[var(--text-primary)]">{field.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
