'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/utils/roles';
import { TermRoster } from '@/components/registrace/TermRoster';
import type { Registration } from '@/types/database';

export default function TiskSoupiskaPage() {
  const termId = useSearchParams().get('term');
  const { user } = useAuth();
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/registrations')
      .then((r) => (r.ok ? r.json() : { registrations: [] }))
      .then((d: { registrations: Registration[] }) => {
        setRegs(d.registrations.filter((x) => x.term_id === termId));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [termId]);

  if (!isAdmin(user?.role)) return null;
  if (!loaded) return <div className="p-8 text-sm text-[var(--text-secondary)]">Načítám…</div>;
  if (!termId || regs.length === 0) return <div className="p-8 text-sm text-[var(--text-secondary)]">Žádná data pro termín.</div>;

  return <TermRoster registrations={regs} program={regs[0].program} termStart={regs[0].term_start} termEnd={regs[0].term_end} />;
}
