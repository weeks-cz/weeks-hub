'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Child } from '@/types/database';

export interface SyncResult {
  childrenCreated: number;
  childrenUpdated: number;
  visitsCreated: number;
  registrationsScanned: number;
}

export function useChildren() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/children');
      if (!res.ok) {
        setError(res.status === 403 ? 'Nemáš oprávnění' : 'Načtení selhalo');
        return;
      }
      const json = await res.json();
      setChildren(json.children ?? []);
    } catch {
      setError('Načtení selhalo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createChild = useCallback(async (values: Partial<Child>): Promise<string | null> => {
    const res = await fetch('/api/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return json.error ?? 'Uložení selhalo';
    await refetch();
    return null;
  }, [refetch]);

  const updateChild = useCallback(async (id: string, values: Partial<Child>): Promise<string | null> => {
    const res = await fetch(`/api/children/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return json.error ?? 'Uložení selhalo';
    await refetch();
    return null;
  }, [refetch]);

  const deleteChild = useCallback(async (id: string): Promise<string | null> => {
    const res = await fetch(`/api/children/${id}`, { method: 'DELETE' });
    if (!res.ok) return 'Smazání selhalo';
    await refetch();
    return null;
  }, [refetch]);

  const syncFromRegistrations = useCallback(async (): Promise<SyncResult | string> => {
    const res = await fetch('/api/children/sync', { method: 'POST' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return json.error ?? 'Synchronizace selhala';
    await refetch();
    return json as SyncResult;
  }, [refetch]);

  return { children, loading, error, refetch, createChild, updateChild, deleteChild, syncFromRegistrations };
}
