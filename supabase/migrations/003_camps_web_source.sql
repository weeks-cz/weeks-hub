-- ===== 003: Add web_source_id column to camps for sync with weeks.cz =====

ALTER TABLE camps ADD COLUMN IF NOT EXISTS web_source_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_camps_web_source_id ON camps(web_source_id);
