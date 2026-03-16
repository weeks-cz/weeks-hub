'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from '@/hooks/useNotifications';
import { useUsers } from '@/hooks/useUsers';
import type { TaskComment } from '@/types/database';
import toast from 'react-hot-toast';

export function useTaskComments(taskId: string | null) {
  const { user } = useAuth();
  const { users } = useUsers();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('task_comments')
      .select('*, user:users(*), attachments:task_attachments(*)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (data) setComments(data);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    if (!taskId) {
      setComments([]);
      return;
    }

    fetchComments();

    const supabase = createClient();
    const channel = supabase
      .channel(`comments-${taskId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_comments', filter: `task_id=eq.${taskId}` },
        () => fetchComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, fetchComments]);

  const addComment = async (content: string, taskAssigneeId?: string | null) => {
    if (!taskId || !user) return;
    const supabase = createClient();
    const { error } = await supabase.from('task_comments').insert({
      task_id: taskId,
      user_id: user.id,
      content,
    });

    if (error) {
      toast.error('Nepodařilo se přidat komentář');
      return;
    }

    // Notify mentioned users
    const mentionRegex = /@(\S+(?:\s\S+)?)/g;
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionName = match[1];
      const mentionedUser = users.find(
        (u) => u.full_name.toLowerCase().startsWith(mentionName.toLowerCase())
      );
      if (mentionedUser && mentionedUser.id !== user.id) {
        createNotification({
          userId: mentionedUser.id,
          type: 'task_assigned',
          title: 'Zmíněn/a v komentáři',
          message: `${user.full_name} tě zmínil/a: "${content.slice(0, 80)}${content.length > 80 ? '...' : ''}"`,
          link: `/board?task=${taskId}`,
        });
      }
    }

    // Notify assignee about new comment (if not the commenter)
    if (taskAssigneeId && taskAssigneeId !== user.id) {
      createNotification({
        userId: taskAssigneeId,
        type: 'task_assigned',
        title: 'Nový komentář',
        message: `${user.full_name} okomentoval/a task: "${content.slice(0, 80)}${content.length > 80 ? '...' : ''}"`,
        link: `/board?task=${taskId}`,
      });
    }

    fetchComments();
  };

  const updateComment = async (commentId: string, content: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('task_comments')
      .update({ content })
      .eq('id', commentId);

    if (error) {
      toast.error('Nepodařilo se upravit komentář');
    } else {
      fetchComments();
    }
  };

  const deleteComment = async (commentId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      toast.error('Nepodařilo se smazat komentář');
    } else {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  return { comments, loading, addComment, updateComment, deleteComment };
}
