'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import type { Camp, CampStatus } from '@/types/database';

export function useCamps() {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchCamps = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('camps')
        .select('*, creator:users!camps_created_by_fkey(*)')
        .order('start_date', { ascending: true });

      if (!error && data) {
        setCamps(data as Camp[]);
      }
    } catch {
      // Silently handle network errors
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-sync from weeks.cz: on mount and every 15 minutes
  const autoSync = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch('/api/sync-camps', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      // Refetch after sync completes
      fetchCamps();
    } catch {
      // Silent - auto-sync should never interrupt the user
    }
  }, [fetchCamps]);

  useEffect(() => {
    fetchCamps();
    // Auto-sync on first load (slight delay to not block initial render)
    const initialSync = setTimeout(autoSync, 3000);
    // Then every 15 minutes
    const interval = setInterval(autoSync, 15 * 60 * 1000);

    const channel = supabase
      .channel('camps-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camps' }, () => {
        fetchCamps();
      })
      .subscribe();

    return () => {
      clearTimeout(initialSync);
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchCamps, autoSync]);

  const getUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  };

  const logActivity = (userId: string, action_type: string, entity_id: string, metadata: Record<string, unknown> = {}) => {
    supabase.from('activity_log').insert({
      user_id: userId,
      action_type,
      entity_type: 'camp',
      entity_id,
      metadata,
    }).then(() => {});
  };

  const createCamp = async (camp: {
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    location?: string;
    capacity: number;
    status: CampStatus;
    registration_url?: string;
    color?: string;
  }) => {
    const userId = await getUserId();
    if (!userId) return null;

    const { data: newCamp, error } = await supabase
      .from('camps')
      .insert({
        title: camp.title,
        description: camp.description || null,
        start_date: camp.start_date,
        end_date: camp.end_date,
        location: camp.location || null,
        capacity: camp.capacity,
        status: camp.status,
        registration_url: camp.registration_url || null,
        color: camp.color || '#10B981',
        created_by: userId,
      })
      .select()
      .single();

    if (newCamp) {
      logActivity(userId, 'camp_created', newCamp.id, { title: camp.title, status: camp.status });
      fetchCamps();
      toast.success('Tábor vytvořen');
    }

    if (error) {
      toast.error('Nepodařilo se vytvořit tábor');
    }

    return newCamp;
  };

  const updateCamp = async (campId: string, updates: Partial<Camp>) => {
    const userId = await getUserId();
    const { creator, ...cleanUpdates } = updates as Camp;

    const { error } = await supabase
      .from('camps')
      .update(cleanUpdates)
      .eq('id', campId);

    if (!error) {
      if (userId) logActivity(userId, 'camp_updated', campId, { title: cleanUpdates.title });
      await fetchCamps();
      toast.success('Tábor aktualizován');
    } else {
      toast.error('Nepodařilo se aktualizovat tábor');
    }

    return !error;
  };

  const deleteCamp = async (campId: string) => {
    setCamps((prev) => prev.filter((c) => c.id !== campId));

    const userId = await getUserId();
    const { error } = await supabase.from('camps').delete().eq('id', campId);

    if (!error && userId) {
      logActivity(userId, 'camp_deleted', campId);
      toast.success('Tábor smazán');
    }

    if (error) {
      toast.error('Nepodařilo se smazat tábor');
      fetchCamps();
    }

    return !error;
  };

  const updateEnrollment = async (campId: string, delta: number) => {
    const camp = camps.find((c) => c.id === campId);
    if (!camp) return false;

    const newCount = Math.max(0, camp.enrolled_count + delta);

    // Optimistic update
    setCamps((prev) => prev.map((c) => c.id === campId ? { ...c, enrolled_count: newCount } : c));

    const userId = await getUserId();
    const { error } = await supabase
      .from('camps')
      .update({ enrolled_count: newCount })
      .eq('id', campId);

    if (!error) {
      if (userId) logActivity(userId, 'camp_enrollment_changed', campId, {
        title: camp.title,
        delta,
        new_count: newCount,
      });
    } else {
      toast.error('Nepodařilo se aktualizovat počet');
      fetchCamps();
    }

    return !error;
  };

  return {
    camps,
    loading,
    createCamp,
    updateCamp,
    deleteCamp,
    updateEnrollment,
    refetch: fetchCamps,
  };
}
