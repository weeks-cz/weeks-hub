'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Registration } from '@/types/database';
import { programName, programCapacity, locationName, KV_TURNUSY } from '@/lib/kvCamps';

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

function novaSkupina(termId: string, program: string, locationId: string, start: string, end: string): TermGroup {
  return {
    termId,
    program,
    programName: programName(program),
    locationName: locationName(locationId),
    termStart: start,
    termEnd: end,
    capacity: programCapacity(program),
    registrations: [],
    activeCount: 0,
    paidCount: 0,
  };
}

function groupByTerm(regs: Registration[]): TermGroup[] {
  const map = new Map<string, TermGroup>();
  // Turnusy v prodeji napřed, ať jsou vidět i bez jediné přihlášky.
  for (const t of KV_TURNUSY) {
    map.set(t.termId, novaSkupina(t.termId, t.program, t.locationId, t.start, t.end));
  }
  for (const r of regs) {
    let g = map.get(r.term_id);
    if (!g) {
      g = novaSkupina(r.term_id, r.program, r.location_id, r.term_start, r.term_end);
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
