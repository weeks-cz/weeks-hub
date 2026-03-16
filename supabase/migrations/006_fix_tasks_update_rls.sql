-- Fix tasks UPDATE RLS policy: allow all team members to update any task
-- Previously restricted to assignee or creator, which blocked drag-and-drop
-- and edits by other team members on the kanban board.

DROP POLICY IF EXISTS "Assignee or creator can update tasks" ON tasks;

CREATE POLICY "Team members can update tasks"
  ON tasks FOR UPDATE
  USING (is_weeks_user());
