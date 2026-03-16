-- ===== SUBTASKS AS REAL TASKS =====
-- Instead of a separate subtasks table, subtasks are tasks with parent_task_id.
-- This gives them full task capabilities: comments, attachments, assignees, labels.

-- 1. Add parent_task_id to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks (parent_task_id) WHERE parent_task_id IS NOT NULL;
