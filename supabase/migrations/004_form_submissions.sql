-- ===== 004: Form Submissions table =====
-- Stores waitlist and contact form submissions from weeks.cz

CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Form type
  form_type TEXT NOT NULL CHECK (form_type IN ('waitlist', 'contact')),

  -- Common fields
  email TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Waitlist-specific fields
  child_name TEXT,
  child_age TEXT,
  program TEXT,
  gdpr_consent BOOLEAN,

  -- Contact-specific fields
  sender_name TEXT,
  message TEXT,

  -- Workflow
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processed', 'archived')),
  notes TEXT,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_form_type ON form_submissions(form_type);
CREATE INDEX idx_form_submissions_submitted_at ON form_submissions(submitted_at DESC);
CREATE INDEX idx_form_submissions_email ON form_submissions(email);

-- Updated_at trigger
CREATE TRIGGER update_form_submissions_updated_at
  BEFORE UPDATE ON form_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Weeks users can view all submissions
CREATE POLICY "Weeks users can view form submissions"
  ON form_submissions FOR SELECT
  USING (is_weeks_user());

-- Weeks users can update submissions (status, notes, etc.)
CREATE POLICY "Weeks users can update form submissions"
  ON form_submissions FOR UPDATE
  USING (is_weeks_user());

-- Weeks users can delete submissions
CREATE POLICY "Weeks users can delete form submissions"
  ON form_submissions FOR DELETE
  USING (is_weeks_user());

-- Insert is allowed for service role only (API endpoint uses service role key)
-- No INSERT policy needed for authenticated users; the API uses service_role to bypass RLS

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE form_submissions;
