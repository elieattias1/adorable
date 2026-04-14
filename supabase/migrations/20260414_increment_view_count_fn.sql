-- Creates the RPC function called by /app/s/[id]/route.ts on every page view.
-- Run this once in the Supabase SQL Editor.

CREATE OR REPLACE FUNCTION increment_view_count(site_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE sites SET view_count = view_count + 1 WHERE id = site_id;
END;
$$;
