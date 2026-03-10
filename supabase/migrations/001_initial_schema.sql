-- ===== Weeks Hub Database Schema =====

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== USERS =====
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== LABELS =====
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366F1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default labels
INSERT INTO labels (name, color) VALUES
  ('Bug', '#EF4444'),
  ('Feature', '#6366F1'),
  ('Design', '#EC4899'),
  ('Urgent', '#F97316'),
  ('Camp Prep', '#10B981'),
  ('Marketing', '#06B6D4');

-- ===== TASKS =====
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== SUBTASKS =====
CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== TASK LABELS (M:N) =====
CREATE TABLE task_labels (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

-- ===== CALENDAR EVENTS =====
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'meeting' CHECK (event_type IN ('camp', 'meeting', 'reminder', 'deadline')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  all_day BOOLEAN NOT NULL DEFAULT FALSE,
  color TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== EVENT ATTENDEES (M:N) =====
CREATE TABLE event_attendees (
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, user_id)
);

-- ===== ACTIVITY LOG =====
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== INDEXES =====
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX idx_calendar_events_start ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);

-- ===== UPDATED_AT TRIGGER =====
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Helper: check if user email ends with @weeks.cz
CREATE OR REPLACE FUNCTION is_weeks_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = auth.uid()) LIKE '%@weeks.cz';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS policies
CREATE POLICY "Users can view all weeks.cz users"
  ON users FOR SELECT
  USING (is_weeks_user());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- TASKS policies
CREATE POLICY "Weeks users can view all tasks"
  ON tasks FOR SELECT
  USING (is_weeks_user());

CREATE POLICY "Weeks users can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (is_weeks_user());

CREATE POLICY "Assignee or creator can update tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = assignee_id OR auth.uid() = created_by);

CREATE POLICY "Creator can delete tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = created_by);

-- SUBTASKS policies
CREATE POLICY "Weeks users can view subtasks"
  ON subtasks FOR SELECT
  USING (is_weeks_user());

CREATE POLICY "Weeks users can manage subtasks"
  ON subtasks FOR INSERT
  WITH CHECK (is_weeks_user());

CREATE POLICY "Weeks users can update subtasks"
  ON subtasks FOR UPDATE
  USING (is_weeks_user());

CREATE POLICY "Weeks users can delete subtasks"
  ON subtasks FOR DELETE
  USING (is_weeks_user());

-- LABELS policies
CREATE POLICY "Weeks users can view labels"
  ON labels FOR SELECT
  USING (is_weeks_user());

CREATE POLICY "Weeks users can manage labels"
  ON labels FOR ALL
  USING (is_weeks_user());

-- TASK_LABELS policies
CREATE POLICY "Weeks users can view task labels"
  ON task_labels FOR SELECT
  USING (is_weeks_user());

CREATE POLICY "Weeks users can manage task labels"
  ON task_labels FOR ALL
  USING (is_weeks_user());

-- CALENDAR_EVENTS policies
CREATE POLICY "Weeks users can view events"
  ON calendar_events FOR SELECT
  USING (is_weeks_user());

CREATE POLICY "Weeks users can create events"
  ON calendar_events FOR INSERT
  WITH CHECK (is_weeks_user());

CREATE POLICY "Creator can update events"
  ON calendar_events FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Creator can delete events"
  ON calendar_events FOR DELETE
  USING (auth.uid() = created_by);

-- EVENT_ATTENDEES policies
CREATE POLICY "Weeks users can view attendees"
  ON event_attendees FOR SELECT
  USING (is_weeks_user());

CREATE POLICY "Weeks users can manage attendees"
  ON event_attendees FOR ALL
  USING (is_weeks_user());

-- ACTIVITY_LOG policies
CREATE POLICY "Weeks users can view activity"
  ON activity_log FOR SELECT
  USING (is_weeks_user());

CREATE POLICY "Weeks users can create activity"
  ON activity_log FOR INSERT
  WITH CHECK (is_weeks_user());

-- ===== REALTIME =====
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE subtasks;
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;

-- ===== AUTO-CREATE USER PROFILE ON SIGNUP =====
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
