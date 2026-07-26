import type { Task } from '@/types/database';

export interface SubtaskStats {
  done: number;
  total: number;
  /** 0-100, for progress bar width */
  progress: number;
}

const EMPTY: SubtaskStats = { done: 0, total: 0, progress: 0 };

function makeStats(done: number, total: number): SubtaskStats {
  return { done, total, progress: total > 0 ? (done / total) * 100 : 0 };
}

/**
 * The board supports two subtask mechanisms side by side:
 * - legacy `subtasks` checklist rows (migration 001), joined onto the task
 * - nested child tasks with `parent_task_id` (migration 008), which are
 *   full tasks living in the same flat `tasks` array
 *
 * Counting only one of them makes tasks look empty, so both are summed.
 * A child task counts as done by its own status; only direct children are
 * counted, deeper nesting is not flattened.
 */
export function getSubtaskStats(task: Task, allTasks: Task[]): SubtaskStats {
  const legacy = task.subtasks ?? [];
  const children = allTasks.filter((t) => t.parent_task_id === task.id);

  return makeStats(
    legacy.filter((s) => s.completed).length + children.filter((t) => t.status === 'done').length,
    legacy.length + children.length
  );
}

/**
 * Same logic in a single pass over the task list, keyed by task id.
 * The board renders every card on every task change, so per-card filtering
 * of the full array would be quadratic.
 */
export function buildSubtaskStatsMap(allTasks: Task[]): Map<string, SubtaskStats> {
  const childCounts = new Map<string, { done: number; total: number }>();

  for (const task of allTasks) {
    if (!task.parent_task_id) continue;
    const entry = childCounts.get(task.parent_task_id) ?? { done: 0, total: 0 };
    entry.total += 1;
    if (task.status === 'done') entry.done += 1;
    childCounts.set(task.parent_task_id, entry);
  }

  const stats = new Map<string, SubtaskStats>();

  for (const task of allTasks) {
    const legacy = task.subtasks ?? [];
    const children = childCounts.get(task.id);

    if (legacy.length === 0 && !children) {
      stats.set(task.id, EMPTY);
      continue;
    }

    stats.set(
      task.id,
      makeStats(
        legacy.filter((s) => s.completed).length + (children?.done ?? 0),
        legacy.length + (children?.total ?? 0)
      )
    );
  }

  return stats;
}
