-- Add screenshot_url column to sites table
-- Stores the public URL of the last generated screenshot (Supabase Storage)

ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS screenshot_url TEXT DEFAULT NULL;
