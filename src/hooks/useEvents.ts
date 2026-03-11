'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import type { CalendarEvent, EventType } from '@/types/database';

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          creator:users!calendar_events_created_by_fkey(*),
          event_attendees(user_id, users(*))
        `)
        .order('start_date', { ascending: true });

      if (!error && data) {
        const eventsWithAttendees = data.map((event: Record<string, unknown>) => ({
          ...event,
          attendees: (event.event_attendees as Array<{ users: unknown }>)?.map((ea) => ea.users).filter(Boolean) || [],
        }));
        setEvents(eventsWithAttendees as CalendarEvent[]);
      }
    } catch {
      // Silently handle network errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents]);

  // Helper: get user ID from local session (no network call)
  const getUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  };

  // Helper: log activity without blocking the caller
  const logActivity = (userId: string, action_type: string, entity_id: string, metadata: Record<string, unknown> = {}) => {
    supabase.from('activity_log').insert({
      user_id: userId,
      action_type,
      entity_type: 'event',
      entity_id,
      metadata,
    }).then(() => {});
  };

  const createEvent = async (event: {
    title: string;
    description?: string;
    event_type: EventType;
    start_date: string;
    end_date?: string | null;
    all_day?: boolean;
    color?: string;
    attendeeIds?: string[];
  }) => {
    const userId = await getUserId();
    if (!userId) return null;

    const { data: newEvent, error } = await supabase
      .from('calendar_events')
      .insert({
        title: event.title,
        description: event.description || null,
        event_type: event.event_type,
        start_date: event.start_date,
        end_date: event.end_date || null,
        all_day: event.all_day ?? false,
        color: event.color || null,
        created_by: userId,
      })
      .select()
      .single();

    if (!error && newEvent && event.attendeeIds?.length) {
      await supabase.from('event_attendees').insert(
        event.attendeeIds.map((uid) => ({ event_id: newEvent.id, user_id: uid }))
      );
    }

    if (newEvent) {
      logActivity(userId, 'event_created', newEvent.id, { title: event.title, event_type: event.event_type });
      fetchEvents();
      toast.success('Událost vytvořena');
    }

    if (error) {
      toast.error('Nepodařilo se vytvořit událost');
    }

    return newEvent;
  };

  const updateEvent = async (eventId: string, updates: Partial<CalendarEvent> & { attendeeIds?: string[] }) => {
    const userId = await getUserId();
    // Strip joined/non-column fields before sending to Supabase
    const { attendeeIds, creator, attendees, id, created_at, updated_at, ...dbUpdates } = updates as CalendarEvent & { attendeeIds?: string[] };

    const { data, error } = await supabase
      .from('calendar_events')
      .update(dbUpdates)
      .eq('id', eventId)
      .select();

    if (error || !data || data.length === 0) {
      toast.error('Nepodařilo se aktualizovat událost');
      return false;
    }

    if (attendeeIds !== undefined) {
      await supabase.from('event_attendees').delete().eq('event_id', eventId);
      if (attendeeIds.length > 0) {
        await supabase.from('event_attendees').insert(
          attendeeIds.map((uid) => ({ event_id: eventId, user_id: uid }))
        );
      }
    }

    if (userId) logActivity(userId, 'event_updated', eventId, { title: dbUpdates.title });
    await fetchEvents();
    toast.success('Událost aktualizována');
    return true;
  };

  const deleteEvent = async (eventId: string) => {
    // Optimistic update
    setEvents((prev) => prev.filter((e) => e.id !== eventId));

    const userId = await getUserId();
    const { data, error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)
      .select();

    if (error || !data || data.length === 0) {
      toast.error('Nepodařilo se smazat událost');
      fetchEvents(); // Revert on failure
      return false;
    }

    if (userId) logActivity(userId, 'event_deleted', eventId);
    toast.success('Událost smazána');
    return true;
  };

  const getEventsForDate = (date: Date) => {
    const dayStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return events.filter((event) => {
      const startStr = event.start_date.slice(0, 10);
      const endStr = event.end_date ? event.end_date.slice(0, 10) : startStr;
      return dayStr >= startStr && dayStr <= endStr;
    });
  };

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    refetch: fetchEvents,
  };
}
