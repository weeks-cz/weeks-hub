'use client';

import { use, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/utils/roles';
import { ParticipantSheet } from '@/components/registrace/ParticipantSheet';
import { NemasOpravneni } from '@/components/ui/NemasOpravneni';
import type { Registration } from '@/types/database';

export default function TiskListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [reg, setReg] = useState<Registration | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch('/api/registrations')
      .then((r) => (r.ok ? r.json() : { registrations: [] }))
      .then((d: { registrations: Registration[] }) => {
        const found = d.registrations.find((x) => x.id === id) ?? null;
        setReg(found);
        setNotFound(!found);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (!isAdmin(user?.role)) return <NemasOpravneni sekce="Nástupní listy" />;
  if (notFound)
    return (
      <div className="p-8 text-sm text-[var(--text-secondary)]">
        Tahle registrace neexistuje — nejspíš byla smazána.
      </div>
    );
  if (!reg) return <div className="p-8 text-sm text-[var(--text-secondary)]">Načítám…</div>;
  return <ParticipantSheet registration={reg} />;
}
