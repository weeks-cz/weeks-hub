'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { revalidateWebCamps } from '@/lib/revalidate-web';
import type { Camp, CampStatus, CampProgram, CampType } from '@/types/database';

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

  useEffect(() => {
    fetchCamps();

    const channel = supabase
      .channel('camps-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camps' }, () => {
        fetchCamps();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCamps]);

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
    location_detail?: string;
    capacity: number;
    status: CampStatus;
    registration_url?: string;
    color?: string;
    program?: CampProgram;
    camp_type?: CampType;
    price?: number;
    ddm_id?: string;
    day_label?: string;
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
        location_detail: camp.location_detail || null,
        capacity: camp.capacity,
        status: camp.status,
        registration_url: camp.registration_url || null,
        color: camp.color || colorForProgram(camp.program),
        program: camp.program || null,
        camp_type: camp.camp_type || null,
        price: camp.price ?? null,
        ddm_id: camp.ddm_id || null,
        day_label: camp.day_label || null,
        created_by: userId,
      })
      .select()
      .single();

    if (newCamp) {
      logActivity(userId, 'camp_created', newCamp.id, { title: camp.title, status: camp.status });
      fetchCamps();
      revalidateWebCamps();
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
    void creator;

    const { error } = await supabase
      .from('camps')
      .update(cleanUpdates)
      .eq('id', campId);

    if (!error) {
      if (userId) logActivity(userId, 'camp_updated', campId, { title: cleanUpdates.title });
      await fetchCamps();
      revalidateWebCamps();
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
      revalidateWebCamps();
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

function colorForProgram(program?: CampProgram): string {
  switch (program) {
    case '3d-tisk': return '#8B5CF6';
    case 'iot': return '#06B6D4';
    case 'tech': return '#10B981';
    default: return '#10B981';
  }
}
