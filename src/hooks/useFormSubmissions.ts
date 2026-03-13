'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import type { FormSubmission, FormSubmissionStatus } from '@/types/database';

export function useFormSubmissions() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchSubmissions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*, processor:users!form_submissions_processed_by_fkey(*)')
        .order('submitted_at', { ascending: false });

      if (!error && data) {
        setSubmissions(data as FormSubmission[]);
      }
    } catch {
      // Silently handle network errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();

    const channel = supabase
      .channel('form-submissions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'form_submissions' }, () => {
        fetchSubmissions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSubmissions]);

  const getUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  };

  const logActivity = (userId: string, action_type: string, entity_id: string, metadata: Record<string, unknown> = {}) => {
    supabase.from('activity_log').insert({
      user_id: userId,
      action_type,
      entity_type: 'form_submission',
      entity_id,
      metadata,
    }).then(() => {});
  };

  const updateStatus = async (id: string, status: FormSubmissionStatus, email: string) => {
    const userId = await getUserId();
    if (!userId) return false;

    const updates: Record<string, unknown> = { status };
    if (status === 'processed' || status === 'archived') {
      updates.processed_by = userId;
      updates.processed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('form_submissions')
      .update(updates)
      .eq('id', id);

    if (!error) {
      const actionType = status === 'processed' ? 'submission_processed' : 'submission_archived';
      logActivity(userId, actionType, id, { email });
      fetchSubmissions();
      toast.success(status === 'processed' ? 'Formulář zpracován' : 'Formulář archivován');
    } else {
      toast.error('Nepodařilo se aktualizovat stav');
    }

    return !error;
  };

  const updateNotes = async (id: string, notes: string, email: string) => {
    const userId = await getUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from('form_submissions')
      .update({ notes })
      .eq('id', id);

    if (!error) {
      logActivity(userId, 'submission_note_added', id, { email });
      fetchSubmissions();
      toast.success('Poznámka uložena');
    } else {
      toast.error('Nepodařilo se uložit poznámku');
    }

    return !error;
  };

  const deleteSubmission = async (id: string, email: string) => {
    const userId = await getUserId();
    if (!userId) return false;

    setSubmissions((prev) => prev.filter((s) => s.id !== id));

    const { error } = await supabase
      .from('form_submissions')
      .delete()
      .eq('id', id);

    if (!error) {
      logActivity(userId, 'submission_deleted', id, { email });
      toast.success('Formulář smazán');
    } else {
      toast.error('Nepodařilo se smazat formulář');
      fetchSubmissions();
    }

    return !error;
  };

  const newCount = useMemo(() => submissions.filter((s) => s.status === 'new').length, [submissions]);

  return {
    submissions,
    loading,
    newCount,
    updateStatus,
    updateNotes,
    deleteSubmission,
    refetch: fetchSubmissions,
  };
}
