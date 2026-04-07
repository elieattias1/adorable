-- Run this in the Supabase SQL editor

-- 1. Contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID        NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name        TEXT,
  email       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  read        BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_reads_submissions" ON contact_submissions
  FOR SELECT USING (
    site_id IN (SELECT id FROM sites WHERE user_id = auth.uid())
  );

CREATE POLICY "owner_updates_submissions" ON contact_submissions
  FOR UPDATE USING (
    site_id IN (SELECT id FROM sites WHERE user_id = auth.uid())
  );

-- 2. View counter column on sites
ALTER TABLE sites ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;
