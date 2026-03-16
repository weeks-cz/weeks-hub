-- ===== BOARD REDESIGN: COMMENTS, ATTACHMENTS, SUBTASK NESTING =====

-- ===== TASK COMMENTS =====
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_task ON task_comments (task_id, created_at);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task comments" ON task_comments FOR SELECT USING (is_weeks_user());
CREATE POLICY "Users can create comments" ON task_comments FOR INSERT WITH CHECK (is_weeks_user() AND auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON task_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON task_comments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON task_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;

-- ===== TASK ATTACHMENTS =====
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attachments_task ON task_attachments (task_id);

ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments" ON task_attachments FOR SELECT USING (is_weeks_user());
CREATE POLICY "Users can create attachments" ON task_attachments FOR INSERT WITH CHECK (is_weeks_user());
CREATE POLICY "Users can delete own attachments" ON task_attachments FOR DELETE USING (auth.uid() = user_id);

-- ===== EXTEND SUBTASKS =====
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS parent_subtask_id UUID REFERENCES subtasks(id) ON DELETE CASCADE;
