-- ─── Reference templates table ────────────────────────────────────────────────
-- Populated by scripts/import-templates.js from scraper/output/

CREATE TABLE IF NOT EXISTS templates (
  id            SERIAL PRIMARY KEY,
  slug          TEXT        NOT NULL UNIQUE,
  name          TEXT        NOT NULL,
  url           TEXT        NOT NULL,
  industry      TEXT        NOT NULL,
  site_type     TEXT        NOT NULL,          -- e.g. "Landing page"
  tags          TEXT[]      NOT NULL DEFAULT '{}',
  priority      TEXT        NOT NULL DEFAULT 'medium',
  fonts         TEXT[]      NOT NULL DEFAULT '{}',
  has_dark_bg   BOOLEAN     NOT NULL DEFAULT FALSE,
  cta_texts     TEXT[]      NOT NULL DEFAULT '{}',
  screenshot_url TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Allow anon reads (used from API routes with anon key in some cases)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_public_read"
  ON templates FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Only service role can insert/update (import script uses service role key)
CREATE POLICY "templates_service_write"
  ON templates FOR ALL
  TO service_role
  USING (TRUE);
