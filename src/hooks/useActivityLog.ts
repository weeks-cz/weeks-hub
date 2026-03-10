'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ActivityLog } from '@/types/database';

export function useActivityLog(limit = 20) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchActivities = useCallback(async () => {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*, user:users!activity_log_user_id_fkey(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && data) {
      setActivities(data as ActivityLog[]);
    }
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchActivities();

    const channel = supabase
      .channel('activity-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, () => {
        fetchActivities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActivities]);

  return { activities, loading };
}

export function getActivityMessage(activity: ActivityLog): string {
  const meta = activity.metadata as Record<string, unknown>;
  switch (activity.action_type) {
    case 'task_created':
      return `vytvořil/a task "${meta.title}"`;
    case 'task_updated':
      return `upravil/a task`;
    case 'task_moved':
      return `přesunul/a task do ${meta.new_status}`;
    case 'task_deleted':
      return `smazal/a task`;
    case 'event_created':
      return `vytvořil/a událost "${meta.title}"`;
    case 'event_updated':
      return `upravil/a událost`;
    case 'event_deleted':
      return `smazal/a událost`;
    case 'subtask_created':
      return `přidal/a subtask`;
    case 'subtask_completed':
      return `dokončil/a subtask`;
    default:
      return activity.action_type;
  }
}
