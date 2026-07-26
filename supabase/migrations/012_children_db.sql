-- Children database: who attended our camps, how many times, and what we know about them.
--
-- Numbering note: this database is shared with the weeks_web repo, which numbers
-- its own migrations independently and also has a 012. Names are descriptive to
-- keep the two apart.
--
-- `registrations` is deliberately left untouched — it is written by the public
-- website and any change there risks the live registration flow.

-- ===== CHILDREN =====
CREATE TABLE IF NOT EXISTS children (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    TEXT NOT NULL,
  birthdate    DATE,

  -- Normalised "name|birthdate" used to recognise the same child across sources.
  -- Built in application code (src/lib/children/matching.ts) rather than as a
  -- generated column: unaccent() is not IMMUTABLE, so Postgres refuses it there,
  -- and keeping the rule in one testable place beats splitting it across layers.
  match_key    TEXT NOT NULL,

  parent_name  TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  insurance    TEXT,
  health_notes TEXT,
  experience   TEXT,
  notes        TEXT,

  source       TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('kv', 'ddm', 'manual')),

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_children_match_key ON children(match_key);
CREATE INDEX IF NOT EXISTS idx_children_full_name ON children(full_name);

-- ===== CHILD VISITS =====
-- One row = one attendance. Visit count is COUNT(*) per child, which is what
-- makes KV registrations and imported DDM rosters add up to a single number.
CREATE TABLE IF NOT EXISTS child_visits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id        UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  -- Points at registrations.id for KV visits. No FK on purpose: that table is
  -- owned by weeks_web and we do not want to constrain its delete behaviour.
  registration_id UUID,

  camp_label      TEXT NOT NULL,
  location        TEXT,
  program         TEXT,
  visit_date      DATE,
  source          TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('kv', 'ddm', 'manual')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_visits_child ON child_visits(child_id);

-- One registration can only ever produce one visit — makes the sync idempotent.
CREATE UNIQUE INDEX IF NOT EXISTS idx_child_visits_registration
  ON child_visits(registration_id)
  WHERE registration_id IS NOT NULL;

-- Same child at the same camp on the same day is a duplicate import, not a second visit.
CREATE UNIQUE INDEX IF NOT EXISTS idx_child_visits_dedup
  ON child_visits(child_id, camp_label, COALESCE(visit_date, DATE '1900-01-01'));

-- ===== UPDATED_AT =====
DROP TRIGGER IF EXISTS children_updated_at ON children;
CREATE TRIGGER children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===== RLS =====
-- Enabled with no policies: children carry health notes, insurance and birth
-- dates, so nothing reaches them through the anon or authenticated key. All
-- access goes through server routes gated by requireAdmin() using the
-- service-role key, same as the registrations section.
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_visits ENABLE ROW LEVEL SECURITY;

-- ===== SEED =====
-- Test child so the section is not empty when the team first opens it.
INSERT INTO children (full_name, birthdate, match_key, parent_name, parent_email, insurance, experience, notes, source)
VALUES (
  'Románek Testovací',
  DATE '2014-05-12',
  'romanek testovaci|2014-05-12',
  'Testovací rodič',
  'test@weeks.cz',
  'VZP',
  'Doma si hraje s Lego Mindstorms.',
  'Testovací záznam — klidně smažte.',
  'manual'
)
ON CONFLICT (match_key) DO NOTHING;

INSERT INTO child_visits (child_id, camp_label, location, program, visit_date, source)
SELECT id, 'Tábor chytrých technologií — ukázka', 'praha', 'mix', DATE '2026-03-28', 'manual'
FROM children
WHERE match_key = 'romanek testovaci|2014-05-12'
ON CONFLICT DO NOTHING;
