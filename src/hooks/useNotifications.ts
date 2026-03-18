'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification } from '@/types/database';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (data) setNotifications(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const supabase = createClient();
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 30));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}

// Helper to create a notification for a specific user
export async function createNotification(params: {
  userId: string;
  type: 'task_assigned' | 'new_submission' | 'camp_enrollment';
  title: string;
  message: string;
  link?: string;
}) {
  const supabase = createClient();
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link || null,
  });
  if (error) {
    console.error('Failed to create notification:', error);
  }
}

// Helper to notify all admins/developers
export async function notifyAdmins(params: {
  type: 'new_submission' | 'camp_enrollment';
  title: string;
  message: string;
  link?: string;
}) {
  const supabase = createClient();
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .in('role', ['admin', 'developer']);

  if (!admins) return;

  const notifications = admins.map((admin) => ({
    user_id: admin.id,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link || null,
  }));

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications);
  }
}
