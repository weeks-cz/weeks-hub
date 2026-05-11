-- ===== 010: Seed camps table with current camp data from weeks.cz =====
-- Idempotent via ON CONFLICT (web_source_id) DO UPDATE.
-- created_by falls back to the first developer/admin user. If none exists, this
-- migration is a no-op (run only after at least one user has signed in).

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM users
  WHERE role IN ('developer', 'admin')
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No developer/admin user found — skipping camp seed. Run this migration after first login.';
    RETURN;
  END IF;

  -- 3D tisk one-day camps
  INSERT INTO camps (
    title, description, start_date, end_date, location, location_detail,
    capacity, enrolled_count, status, registration_url, color,
    program, camp_type, price, ddm_id, day_label, display_order,
    web_source_id, created_by
  ) VALUES
    ('Jednodenní tábor 3D tisku', '3D tisk | jednodenní | 1490 Kč', '2026-04-19', '2026-04-19',
     'HWLab Praha', 'Kongresové centrum Praha, 5. května 11, Praha 4',
     15, 0, 'open_with_link', 'https://www.ddmp6.cz/tabory/?id=775#js-application', '#8B5CF6',
     '3d-tisk', 'oneday', 1490, '775', 'neděle', 10, '3d-775', v_user_id),

    ('Jednodenní tábor 3D tisku', '3D tisk | jednodenní | 1490 Kč', '2026-04-25', '2026-04-25',
     'HWLab Praha', 'Kongresové centrum Praha, 5. května 11, Praha 4',
     15, 0, 'collecting_interest', NULL, '#8B5CF6',
     '3d-tisk', 'oneday', 1490, NULL, 'sobota', 20, '3d-25-04', v_user_id),

    ('Jednodenní tábor 3D tisku', '3D tisk | jednodenní | 1490 Kč', '2026-05-03', '2026-05-03',
     'HWLab Praha', 'Kongresové centrum Praha, 5. května 11, Praha 4',
     15, 0, 'collecting_interest', NULL, '#8B5CF6',
     '3d-tisk', 'oneday', 1490, NULL, 'neděle', 30, '3d-03-05', v_user_id),

    ('Jednodenní tábor 3D tisku', '3D tisk | jednodenní | 1490 Kč', '2026-05-09', '2026-05-09',
     'HWLab Praha', 'Kongresové centrum Praha, 5. května 11, Praha 4',
     15, 0, 'collecting_interest', NULL, '#8B5CF6',
     '3d-tisk', 'oneday', 1490, NULL, 'sobota', 40, '3d-09-05', v_user_id),

    ('Jednodenní tábor 3D tisku', '3D tisk | jednodenní | 1490 Kč', '2026-05-16', '2026-05-16',
     'HWLab Praha', 'Kongresové centrum Praha, 5. května 11, Praha 4',
     15, 0, 'open_with_link', 'https://www.ddmp6.cz/tabory/?id=786#js-application', '#8B5CF6',
     '3d-tisk', 'oneday', 1490, '786', 'sobota', 50, '3d-786', v_user_id),

    ('Jednodenní tábor 3D tisku', '3D tisk | jednodenní | 1490 Kč', '2026-06-21', '2026-06-21',
     'HWLab Praha', 'Kongresové centrum Praha, 5. května 11, Praha 4',
     15, 0, 'open_with_link', 'https://www.ddmp6.cz/tabory/?id=789#js-application', '#8B5CF6',
     '3d-tisk', 'oneday', 1490, '789', 'neděle', 60, '3d-789', v_user_id),

  -- IoT one-day camps
    ('Jednodenní tábor IoT & elektroniky', 'IoT | jednodenní | 1490 Kč', '2026-04-18', '2026-04-18',
     'HWLab Praha', 'Kongresové centrum Praha, 5. května 11, Praha 4',
     15, 0, 'open_with_link', 'https://www.ddmp6.cz/tabory/?id=773#js-application', '#06B6D4',
     'iot', 'oneday', 1490, '773', 'sobota', 10, 'iot-773', v_user_id),

    ('Jednodenní tábor IoT & elektroniky', 'IoT | jednodenní | 1490 Kč', '2026-04-26', '2026-04-26',
     'HWLab Praha', 'Kongresové centrum Praha, 5. května 11, Praha 4',
     15, 0, 'collecting_interest', NULL, '#06B6D4',
     'iot', 'oneday', 1490, NULL, 'neděle', 20, 'iot-26-04', v_user_id),

    ('Jednodenní tábor IoT & elektroniky', 'IoT | jednodenní | 1490 Kč', '2026-05-02', '2026-05-02',
     'HWLab Praha', 'Kongresové centrum Praha, 5. května 11, Praha 4',
     15, 0, 'collecting_interest', NULL, '#06B6D4',
     'iot', 'oneday', 1490, NULL, 'sobota', 30, 'iot-02-05', v_user_id),

    ('Jednodenní tábor IoT & elektroniky', 'IoT | jednodenní | 1490 Kč', '2026-05-10', '2026-05-10',
     'HWLab Praha', 'Kongresové centrum Praha, 5. května 11, Praha 4',
     15, 0, 'collecting_interest', NULL, '#06B6D4',
     'iot', 'oneday', 1490, NULL, 'neděle', 40, 'iot-10-05', v_user_id),

    ('Jednodenní tábor IoT & elektroniky', 'IoT | jednodenní | 1490 Kč', '2026-05-17', '2026-05-17',
     'HWLab Praha', 'Kongresové centrum Praha, 5. května 11, Praha 4',
     15, 0, 'open_with_link', 'https://www.ddmp6.cz/tabory/?id=787#js-application', '#06B6D4',
     'iot', 'oneday', 1490, '787', 'neděle', 50, 'iot-787', v_user_id),

    ('Jednodenní tábor IoT & elektroniky', 'IoT | jednodenní | 1490 Kč', '2026-06-20', '2026-06-20',
     'HWLab Praha', 'Kongresové centrum Praha, 5. května 11, Praha 4',
     15, 0, 'open_with_link', 'https://www.ddmp6.cz/tabory/?id=788#js-application', '#06B6D4',
     'iot', 'oneday', 1490, '788', 'sobota', 60, 'iot-788', v_user_id),

  -- Summer weekend MIX camps (collecting interest)
    ('Letní víkendový tábor', 'MIX | víkendový | 2990 Kč', '2026-07-04', '2026-07-05',
     'TBD', '', 15, 0, 'collecting_interest', NULL, '#10B981',
     'tech', 'weekend', 2990, NULL, NULL, 100, 'leto-04-07', v_user_id),

    ('Letní víkendový tábor', 'MIX | víkendový | 2990 Kč', '2026-07-11', '2026-07-12',
     'TBD', '', 15, 0, 'collecting_interest', NULL, '#10B981',
     'tech', 'weekend', 2990, NULL, NULL, 110, 'leto-11-07', v_user_id),

    ('Letní víkendový tábor', 'MIX | víkendový | 2990 Kč', '2026-07-18', '2026-07-19',
     'TBD', '', 15, 0, 'collecting_interest', NULL, '#10B981',
     'tech', 'weekend', 2990, NULL, NULL, 120, 'leto-18-07', v_user_id),

    ('Letní víkendový tábor', 'MIX | víkendový | 2990 Kč', '2026-07-25', '2026-07-26',
     'TBD', '', 15, 0, 'collecting_interest', NULL, '#10B981',
     'tech', 'weekend', 2990, NULL, NULL, 130, 'leto-25-07', v_user_id),

    ('Letní víkendový tábor', 'MIX | víkendový | 2990 Kč', '2026-08-01', '2026-08-02',
     'TBD', '', 15, 0, 'collecting_interest', NULL, '#10B981',
     'tech', 'weekend', 2990, NULL, NULL, 140, 'leto-01-08', v_user_id),

    ('Letní víkendový tábor', 'MIX | víkendový | 2990 Kč', '2026-08-08', '2026-08-09',
     'TBD', '', 15, 0, 'collecting_interest', NULL, '#10B981',
     'tech', 'weekend', 2990, NULL, NULL, 150, 'leto-08-08', v_user_id),

    ('Letní víkendový tábor', 'MIX | víkendový | 2990 Kč', '2026-08-29', '2026-08-30',
     'TBD', '', 15, 0, 'collecting_interest', NULL, '#10B981',
     'tech', 'weekend', 2990, NULL, NULL, 160, 'leto-29-08', v_user_id)

  ON CONFLICT (web_source_id) DO UPDATE SET
    program = EXCLUDED.program,
    camp_type = EXCLUDED.camp_type,
    price = EXCLUDED.price,
    ddm_id = EXCLUDED.ddm_id,
    day_label = EXCLUDED.day_label,
    location_detail = EXCLUDED.location_detail,
    display_order = EXCLUDED.display_order,
    -- Don't overwrite enrollment, status, registration_url, or capacity if hub
    -- has been editing them — those fields are hub-owned post-seed.
    title = EXCLUDED.title;
END $$;
