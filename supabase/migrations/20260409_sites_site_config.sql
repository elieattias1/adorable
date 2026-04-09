-- Add site_config JSONB to sites table for editable live data (hours, phone, address, etc.)
ALTER TABLE sites ADD COLUMN IF NOT EXISTS site_config JSONB DEFAULT '{}'::jsonb;
