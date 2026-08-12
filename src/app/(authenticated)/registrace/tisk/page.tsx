'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/utils/roles';
import { TermRoster } from '@/components/registrace/TermRoster';
import { NemasOpravneni } from '@/components/ui/NemasOpravneni';
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

  // Dřív se neadminovi vrátilo null, tedy bílá prázdná stránka bez vysvětlení.
  if (!isAdmin(user?.role)) return <NemasOpravneni sekce="Tiskové soupisky" />;
  if (!loaded) return <div className="p-8 text-sm text-[var(--text-secondary)]">Načítám…</div>;
  if (!termId || regs.length === 0)
    return (
      <div className="p-8 text-sm text-[var(--text-secondary)]">
        Pro tenhle termín zatím není žádná registrace, není co tisknout.
      </div>
    );

  return <TermRoster registrations={regs} program={regs[0].program} termStart={regs[0].term_start} termEnd={regs[0].term_end} />;
}
