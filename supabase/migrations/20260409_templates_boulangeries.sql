-- Add quality score, html storage, cookies-wall flag to templates
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS quality_score   INT,          -- 1–10 from Claude vision
  ADD COLUMN IF NOT EXISTS html_url        TEXT,         -- public URL to uploaded home HTML
  ADD COLUMN IF NOT EXISTS has_cookies_wall BOOLEAN NOT NULL DEFAULT FALSE;
