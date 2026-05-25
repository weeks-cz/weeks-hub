-- ===== 011: single_day_option na camps =====
-- Vlajka pro víkendové tábory, kde lze přijít jen na jeden den
-- (dvoudenní 3D tisk — web zobrazí blok "Chceš přijít jen na jeden den?").
ALTER TABLE camps ADD COLUMN IF NOT EXISTS single_day_option BOOLEAN NOT NULL DEFAULT false;
