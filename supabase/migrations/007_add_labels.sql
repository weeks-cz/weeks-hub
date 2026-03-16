-- Add more labels for web, social media, and other categories
INSERT INTO labels (name, color) VALUES
  ('Web', '#3B82F6'),
  ('Sociální sítě', '#E91E8F'),
  ('Obsah', '#8B5CF6'),
  ('Admin', '#64748B'),
  ('Finance', '#10B981'),
  ('Komunikace', '#F59E0B'),
  ('Fotky/Video', '#06B6D4'),
  ('Tisk', '#D97706')
ON CONFLICT DO NOTHING;
