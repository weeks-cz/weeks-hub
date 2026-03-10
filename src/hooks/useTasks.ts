'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Task, TaskStatus, TaskPriority, Subtask } from '@/types/database';

interface TaskFilters {
  assigneeId?: string | null;
  priority?: TaskPriority | null;
  labelId?: string | null;
}

export function useTasks(filters?: TaskFilters) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchTasks = useCallback(async () => {
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
    setLoading(false);
  }, [filters?.assigneeId, filters?.priority, filters?.labelId]);

  useEffect(() => {
    fetchTasks();

    // Realtime subscription
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const createTask = async (task: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string | null;
    assignee_id?: string | null;
    labelIds?: string[];
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

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
        created_by: user.id,
        position,
      })
      .select()
      .single();

    if (!error && newTask && task.labelIds?.length) {
      await supabase.from('task_labels').insert(
        task.labelIds.map((labelId) => ({ task_id: newTask.id, label_id: labelId }))
      );
    }

    // Log activity
    if (newTask) {
      await supabase.from('activity_log').insert({
        user_id: user.id,
        action_type: 'task_created',
        entity_type: 'task',
        entity_id: newTask.id,
        metadata: { title: task.title },
      });
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

    // Log activity
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_log').insert({
          user_id: user.id,
          action_type: 'task_updated',
          entity_type: 'task',
          entity_id: taskId,
          metadata: { updates: Object.keys(cleanUpdates) },
        });
      }
    }

    return !error;
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus, newPosition: number) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, position: newPosition })
      .eq('id', taskId);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_log').insert({
          user_id: user.id,
          action_type: 'task_moved',
          entity_type: 'task',
          entity_id: taskId,
          metadata: { new_status: newStatus },
        });
      }
    }

    return !error;
  };

  const deleteTask = async (taskId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (!error && user) {
      await supabase.from('activity_log').insert({
        user_id: user.id,
        action_type: 'task_deleted',
        entity_type: 'task',
        entity_id: taskId,
        metadata: {},
      });
    }

    return !error;
  };

  // Subtask operations
  const addSubtask = async (taskId: string, title: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

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

    return error ? null : data;
  };

  const toggleSubtask = async (subtaskId: string, completed: boolean) => {
    const { error } = await supabase
      .from('subtasks')
      .update({ completed })
      .eq('id', subtaskId);
    return !error;
  };

  const deleteSubtask = async (subtaskId: string) => {
    const { error } = await supabase.from('subtasks').delete().eq('id', subtaskId);
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
