-- ─── reference_sites: scraped real-world sites used as AI design references ───
-- Keeps real names, URLs, screenshots, HTML. NOT shown in the UI template picker.

CREATE TABLE IF NOT EXISTS reference_sites (
  id              SERIAL PRIMARY KEY,
  slug            TEXT        NOT NULL UNIQUE,
  name            TEXT        NOT NULL,
  url             TEXT        NOT NULL,
  industry        TEXT        NOT NULL,   -- e.g. 'Boulangerie', 'Restaurant'
  site_type       TEXT        NOT NULL DEFAULT 'business',
  tags            TEXT[]      NOT NULL DEFAULT '{}',
  fonts           TEXT[]      NOT NULL DEFAULT '{}',
  has_dark_bg     BOOLEAN     NOT NULL DEFAULT FALSE,
  cta_texts       TEXT[]      NOT NULL DEFAULT '{}',
  screenshot_url  TEXT,
  html_url        TEXT,
  quality_score   INT,
  has_cookies_wall BOOLEAN    NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reference_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reference_sites_public_read" ON reference_sites FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "reference_sites_service_write" ON reference_sites FOR ALL TO service_role USING (TRUE);

-- ─── Move existing boulangerie rows from templates → reference_sites ──────────
INSERT INTO reference_sites (slug, name, url, industry, site_type, tags, fonts, has_dark_bg, cta_texts, screenshot_url, html_url, quality_score, has_cookies_wall, created_at)
SELECT slug, name, url, industry, site_type, tags, fonts, has_dark_bg, cta_texts, screenshot_url, html_url, quality_score, has_cookies_wall, created_at
FROM templates
WHERE industry = 'Boulangerie'
ON CONFLICT (slug) DO NOTHING;

DELETE FROM templates WHERE industry = 'Boulangerie';

-- ─── Add react_code to templates (anonymized, UI-facing) ─────────────────────
ALTER TABLE templates ADD COLUMN IF NOT EXISTS react_code TEXT;
