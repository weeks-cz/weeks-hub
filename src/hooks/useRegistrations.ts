'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Registration } from '@/types/database';
import { programName, programCapacity, locationName } from '@/lib/kvCamps';

export interface TermGroup {
  termId: string;
  program: string;
  programName: string;
  locationName: string;
  termStart: string;
  termEnd: string;
  capacity: number;
  registrations: Registration[];
  activeCount: number; // ne-cancelled (drží místo)
  paidCount: number;
}

function groupByTerm(regs: Registration[]): TermGroup[] {
  const map = new Map<string, TermGroup>();
  for (const r of regs) {
    let g = map.get(r.term_id);
    if (!g) {
      g = {
        termId: r.term_id,
        program: r.program,
        programName: programName(r.program),
        locationName: locationName(r.location_id),
        termStart: r.term_start,
        termEnd: r.term_end,
        capacity: programCapacity(r.program),
        registrations: [],
        activeCount: 0,
        paidCount: 0,
      };
      map.set(r.term_id, g);
    }
    g.registrations.push(r);
    if (r.status !== 'cancelled') g.activeCount++;
    if (r.payment_status === 'completed') g.paidCount++;
  }
  return Array.from(map.values()).sort((a, b) => a.termStart.localeCompare(b.termStart));
}

export function useRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [byTerm, setByTerm] = useState<TermGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/registrations');
      if (!res.ok) {
        setError(res.status === 403 ? 'Nemáš oprávnění' : 'Načtení selhalo');
        return;
      }
      const { registrations: regs } = (await res.json()) as { registrations: Registration[] };
      setRegistrations(regs);
      setByTerm(groupByTerm(regs));
    } catch {
      setError('Načtení selhalo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { registrations, byTerm, loading, error, refetch };
}
