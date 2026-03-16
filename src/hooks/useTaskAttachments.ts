'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { TaskAttachment } from '@/types/database';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function useTaskAttachments(taskId: string | null) {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchAttachments = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('task_attachments')
      .select('*')
      .eq('task_id', taskId)
      .is('comment_id', null)
      .order('created_at', { ascending: false });

    if (data) setAttachments(data);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    if (!taskId) {
      setAttachments([]);
      return;
    }
    fetchAttachments();
  }, [taskId, fetchAttachments]);

  const uploadAttachment = async (file: File, commentId?: string) => {
    if (!taskId || !user) return null;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Maximální velikost souboru: 10 MB');
      return null;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const uniqueId = crypto.randomUUID();
    const storagePath = `tasks/${taskId}/${uniqueId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(storagePath, file);

    if (uploadError) {
      console.error('Attachment upload error:', uploadError);
      toast.error(`Nahrávání selhalo: ${uploadError.message}`);
      setUploading(false);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(storagePath);

    const { data: attachment, error: insertError } = await supabase
      .from('task_attachments')
      .insert({
        task_id: taskId,
        comment_id: commentId || null,
        user_id: user.id,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
      })
      .select()
      .single();

    if (insertError) {
      toast.error('Nepodařilo se uložit přílohu');
      setUploading(false);
      return null;
    }

    if (!commentId) {
      fetchAttachments();
    }
    toast.success('Soubor nahrán');
    setUploading(false);
    return attachment as TaskAttachment;
  };

  const deleteAttachment = async (attachmentId: string, fileUrl: string) => {
    const supabase = createClient();

    // Extract storage path from URL
    const urlObj = new URL(fileUrl);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/attachments\/(.+)/);
    if (pathMatch) {
      await supabase.storage.from('attachments').remove([pathMatch[1]]);
    }

    const { error } = await supabase
      .from('task_attachments')
      .delete()
      .eq('id', attachmentId);

    if (error) {
      toast.error('Nepodařilo se smazat přílohu');
    } else {
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      toast.success('Příloha smazána');
    }
  };

  return { attachments, loading, uploading, uploadAttachment, deleteAttachment, fetchAttachments };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
