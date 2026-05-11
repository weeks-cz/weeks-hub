-- ===== 009: Camps web fields — make camps table source of truth for weeks.cz =====

-- Add columns the public website needs to render camp pages.
-- These complement the existing scheduling/enrollment fields used by the hub.

ALTER TABLE camps ADD COLUMN IF NOT EXISTS program TEXT;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS camp_type TEXT
  CHECK (camp_type IS NULL OR camp_type IN ('weekend', 'oneday'));
ALTER TABLE camps ADD COLUMN IF NOT EXISTS price INTEGER;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS ddm_id TEXT;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS day_label TEXT;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS location_detail TEXT;
ALTER TABLE camps ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_camps_program ON camps(program);
CREATE INDEX IF NOT EXISTS idx_camps_camp_type ON camps(camp_type);

-- Public read policy: anyone (including unauthenticated weeks.cz visitors via service-role
-- or anon key) can SELECT camps. Writes still gated to weeks users.
DROP POLICY IF EXISTS "Public can view camps" ON camps;
CREATE POLICY "Public can view camps"
  ON camps FOR SELECT
  TO anon, authenticated
  USING (true);

-- The existing "Weeks users can view camps" policy stays for authenticated hub users.
-- Postgres OR-combines SELECT policies, so anon gets read access without affecting hub.
