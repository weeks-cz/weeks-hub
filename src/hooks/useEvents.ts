'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CalendarEvent, EventType } from '@/types/database';

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchEvents = useCallback(async () => {
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
    setLoading(false);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

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
        created_by: user.id,
      })
      .select()
      .single();

    if (!error && newEvent && event.attendeeIds?.length) {
      await supabase.from('event_attendees').insert(
        event.attendeeIds.map((userId) => ({ event_id: newEvent.id, user_id: userId }))
      );
    }

    if (newEvent) {
      await supabase.from('activity_log').insert({
        user_id: user.id,
        action_type: 'event_created',
        entity_type: 'event',
        entity_id: newEvent.id,
        metadata: { title: event.title, event_type: event.event_type },
      });
    }

    return newEvent;
  };

  const updateEvent = async (eventId: string, updates: Partial<CalendarEvent> & { attendeeIds?: string[] }) => {
    const { attendeeIds, creator, attendees, ...cleanUpdates } = updates as CalendarEvent & { attendeeIds?: string[] };

    const { error } = await supabase
      .from('calendar_events')
      .update(cleanUpdates)
      .eq('id', eventId);

    if (!error && attendeeIds !== undefined) {
      await supabase.from('event_attendees').delete().eq('event_id', eventId);
      if (attendeeIds.length > 0) {
        await supabase.from('event_attendees').insert(
          attendeeIds.map((userId) => ({ event_id: eventId, user_id: userId }))
        );
      }
    }

    return !error;
  };

  const deleteEvent = async (eventId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('calendar_events').delete().eq('id', eventId);

    if (!error && user) {
      await supabase.from('activity_log').insert({
        user_id: user.id,
        action_type: 'event_deleted',
        entity_type: 'event',
        entity_id: eventId,
        metadata: {},
      });
    }

    return !error;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const start = new Date(event.start_date);
      const end = event.end_date ? new Date(event.end_date) : start;
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      return start <= dayEnd && end >= d;
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
