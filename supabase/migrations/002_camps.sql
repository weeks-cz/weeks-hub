-- ===== 002: Camps table + RLS fix for calendar events =====

-- Fix: Allow all weeks.cz users to update/delete calendar events (not just creator)
DROP POLICY IF EXISTS "Creator can update events" ON calendar_events;
DROP POLICY IF EXISTS "Creator can delete events" ON calendar_events;

CREATE POLICY "Weeks users can update events"
  ON calendar_events FOR UPDATE
  USING (is_weeks_user());

CREATE POLICY "Weeks users can delete events"
  ON calendar_events FOR DELETE
  USING (is_weeks_user());

-- ===== CAMPS TABLE =====
CREATE TABLE camps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT,
  capacity INTEGER NOT NULL DEFAULT 0,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'collecting_interest'
    CHECK (status IN ('collecting_interest', 'open_no_link', 'open_with_link', 'full', 'closed')),
  registration_url TEXT,
  color TEXT DEFAULT '#10B981',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_camps_start_date ON camps(start_date);
CREATE INDEX idx_camps_status ON camps(status);

-- Updated_at trigger
CREATE TRIGGER update_camps_updated_at
  BEFORE UPDATE ON camps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE camps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Weeks users can view camps"
  ON camps FOR SELECT
  USING (is_weeks_user());

CREATE POLICY "Weeks users can create camps"
  ON camps FOR INSERT
  WITH CHECK (is_weeks_user());

CREATE POLICY "Weeks users can update camps"
  ON camps FOR UPDATE
  USING (is_weeks_user());

CREATE POLICY "Weeks users can delete camps"
  ON camps FOR DELETE
  USING (is_weeks_user());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE camps;
