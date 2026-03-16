'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import type { Task, TaskStatus, TaskPriority, Subtask } from '@/types/database';
import { createNotification } from '@/hooks/useNotifications';

interface TaskFilters {
  assigneeId?: string | null;
  priority?: TaskPriority | null;
  labelId?: string | null;
}

export function useTasks(filters?: TaskFilters) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  // Suppress realtime refetch briefly after optimistic updates
  const suppressRealtimeUntil = useRef(0);

  const fetchTasks = useCallback(async () => {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assignee:users!tasks_assignee_id_fkey(*),
          creator:users!tasks_created_by_fkey(*),
          subtasks(*),
          task_labels(label_id, labels(*))
        `)
        .order('position', { ascending: true });

      if (filters?.assigneeId) {
        query = query.eq('assignee_id', filters.assigneeId);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (!error && data) {
        const tasksWithLabels = data.map((task: Record<string, unknown>) => ({
          ...task,
          labels: (task.task_labels as Array<{ labels: unknown }>)?.map((tl) => tl.labels).filter(Boolean) || [],
        }));

        let filtered = tasksWithLabels as Task[];
        if (filters?.labelId) {
          filtered = filtered.filter((t) =>
            t.labels?.some((l) => l.id === filters.labelId)
          );
        }

        setTasks(filtered);
      }
    } catch {
      // Silently handle network errors
    } finally {
      setLoading(false);
    }
  }, [filters?.assigneeId, filters?.priority, filters?.labelId]);

  useEffect(() => {
    fetchTasks();

    // Realtime subscription for cross-user updates.
    // Respects suppressRealtimeUntil to prevent overwriting optimistic updates.
    const realtimeFetch = () => {
      if (Date.now() < suppressRealtimeUntil.current) return;
      fetchTasks();
    };

    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, realtimeFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks' }, realtimeFetch)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

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
      entity_type: 'task',
      entity_id,
      metadata,
    }).then(() => {});
  };

  const createTask = async (task: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string | null;
    assignee_id?: string | null;
    labelIds?: string[];
  }) => {
    const userId = await getUserId();
    if (!userId) return null;

    // Get max position for the status column
    const { data: maxPosData } = await supabase
      .from('tasks')
      .select('position')
      .eq('status', task.status || 'todo')
      .order('position', { ascending: false })
      .limit(1);

    const position = maxPosData?.[0]?.position != null ? maxPosData[0].position + 1 : 0;

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert({
        title: task.title,
        description: task.description || null,
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        due_date: task.due_date || null,
        assignee_id: task.assignee_id || null,
        created_by: userId,
        position,
      })
      .select()
      .single();

    if (!error && newTask && task.labelIds?.length) {
      await supabase.from('task_labels').insert(
        task.labelIds.map((labelId) => ({ task_id: newTask.id, label_id: labelId }))
      );
    }

    if (newTask) {
      logActivity(userId, 'task_created', newTask.id, { title: task.title });
      // Notify assignee if assigned to someone else
      if (task.assignee_id && task.assignee_id !== userId) {
        createNotification({
          userId: task.assignee_id,
          type: 'task_assigned',
          title: 'Nový task',
          message: `Byl ti přiřazen task: ${task.title}`,
          link: '/board',
        });
      }
      fetchTasks();
      toast.success('Task vytvořen');
    }

    if (error) {
      toast.error('Nepodařilo se vytvořit task');
    }

    return newTask;
  };

  const updateTask = async (taskId: string, updates: Partial<Task> & { labelIds?: string[] }) => {
    const { labelIds, ...taskUpdates } = updates;
    const { assignee, creator, labels, subtasks, ...cleanUpdates } = taskUpdates as Task;

    const { error } = await supabase
      .from('tasks')
      .update(cleanUpdates)
      .eq('id', taskId);

    if (!error && labelIds !== undefined) {
      await supabase.from('task_labels').delete().eq('task_id', taskId);
      if (labelIds.length > 0) {
        await supabase.from('task_labels').insert(
          labelIds.map((labelId) => ({ task_id: taskId, label_id: labelId }))
        );
      }
    }

    if (!error) {
      const userId = await getUserId();
      if (userId) {
        logActivity(userId, 'task_updated', taskId, { updates: Object.keys(cleanUpdates) });
        // Notify new assignee if changed to someone else
        if (cleanUpdates.assignee_id && cleanUpdates.assignee_id !== userId) {
          const existingTask = tasks.find((t) => t.id === taskId);
          if (existingTask && existingTask.assignee_id !== cleanUpdates.assignee_id) {
            createNotification({
              userId: cleanUpdates.assignee_id,
              type: 'task_assigned',
              title: 'Task přiřazen',
              message: `Byl ti přiřazen task: ${existingTask.title}`,
              link: '/board',
            });
          }
        }
      }
      fetchTasks();
      toast.success('Task aktualizován');
    } else {
      toast.error('Nepodařilo se aktualizovat task');
    }

    return !error;
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus, newPosition: number) => {
    // Compute the full new ordering for affected columns, then apply
    // both the optimistic local update and the server writes at once.
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return false;

    const oldStatus = task.status;

    // Build reordered lists for the source and destination columns
    const destTasks = tasks
      .filter((t) => t.status === newStatus && t.id !== taskId)
      .sort((a, b) => a.position - b.position);
    destTasks.splice(newPosition, 0, { ...task, status: newStatus } as Task);

    // Assign sequential positions
    const updates: { id: string; status: TaskStatus; position: number }[] = [];
    destTasks.forEach((t, i) => {
      updates.push({ id: t.id, status: newStatus, position: i });
    });

    // If moved across columns, also reorder the source column
    if (oldStatus !== newStatus) {
      const srcTasks = tasks
        .filter((t) => t.status === oldStatus && t.id !== taskId)
        .sort((a, b) => a.position - b.position);
      srcTasks.forEach((t, i) => {
        updates.push({ id: t.id, status: oldStatus, position: i });
      });
    }

    // Optimistic update
    setTasks((prev) => {
      const next = [...prev];
      for (const u of updates) {
        const idx = next.findIndex((t) => t.id === u.id);
        if (idx !== -1) {
          next[idx] = { ...next[idx], status: u.status, position: u.position };
        }
      }
      return next;
    });

    // Suppress realtime refetch while server writes are in progress
    suppressRealtimeUntil.current = Date.now() + 3000;

    // Write all position updates to the server
    let hasError = false;
    await Promise.all(
      updates.map(({ id, status, position }) =>
        supabase
          .from('tasks')
          .update({ status, position })
          .eq('id', id)
          .then(({ error }) => { if (error) hasError = true; })
      )
    );

    if (!hasError) {
      const userId = await getUserId();
      if (userId) {
        logActivity(userId, 'task_moved', taskId, { new_status: newStatus });
      }
    } else {
      toast.error('Nepodařilo se přesunout task');
    }

    // Sync with server after writes complete
    fetchTasks();

    return !hasError;
  };

  const deleteTask = async (taskId: string) => {
    // Optimistic update: remove from local state immediately
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    const userId = await getUserId();
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (!error && userId) {
      logActivity(userId, 'task_deleted', taskId);
      toast.success('Task smazán');
    }

    if (error) {
      toast.error('Nepodařilo se smazat task');
      // Revert on failure
      fetchTasks();
    }

    return !error;
  };

  // Subtask operations
  const addSubtask = async (taskId: string, title: string) => {
    const userId = await getUserId();
    if (!userId) return null;

    const { data: maxPosData } = await supabase
      .from('subtasks')
      .select('position')
      .eq('task_id', taskId)
      .order('position', { ascending: false })
      .limit(1);

    const position = maxPosData?.[0]?.position != null ? maxPosData[0].position + 1 : 0;

    const { data, error } = await supabase
      .from('subtasks')
      .insert({ task_id: taskId, title, position })
      .select()
      .single();

    if (!error) fetchTasks();

    return error ? null : data;
  };

  const toggleSubtask = async (subtaskId: string, completed: boolean) => {
    const { error } = await supabase
      .from('subtasks')
      .update({ completed })
      .eq('id', subtaskId);

    if (!error) fetchTasks();

    return !error;
  };

  const deleteSubtask = async (subtaskId: string) => {
    const { error } = await supabase.from('subtasks').delete().eq('id', subtaskId);

    if (!error) fetchTasks();

    return !error;
  };

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    getTasksByStatus,
    refetch: fetchTasks,
  };
}
