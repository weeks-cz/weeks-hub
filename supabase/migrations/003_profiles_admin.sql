-- ===== EXTEND USER PROFILES & ROLE SYSTEM =====

-- 1. Drop old role constraint and add new one with 'developer' role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('developer', 'admin', 'member'));

-- 2. Add new profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_sport TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_color TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_food TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS motto TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_avatar_url TEXT;

-- 3. Set Lukáš Kubík as developer (by email)
UPDATE users SET role = 'developer' WHERE email = 'lukas.kubik@weeks.cz';

-- 4. Admin RLS policies for user management
-- Admin/developer can update other users' non-role fields
CREATE POLICY "Admin can update user profiles"
  ON users FOR UPDATE
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'developer')
  );

-- Developer can delete users
CREATE POLICY "Developer can delete users"
  ON users FOR DELETE
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'developer'
  );

-- 5. Supabase Storage bucket for avatars
-- NOTE: Run in Supabase dashboard or via supabase CLI:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
--
-- Storage policies (run in SQL editor):
-- CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
-- CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE
--   USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
-- CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE
--   USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
-- CREATE POLICY "Public avatar read" ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');
