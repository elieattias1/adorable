-- Add react_code column to reference_sites so templates can be stored there directly.
-- The old templates table still exists for non-bakery templates; boulangerie templates
-- now live fully in reference_sites (screenshot from the real site, react_code generated
-- by the replication script).

ALTER TABLE reference_sites ADD COLUMN IF NOT EXISTS react_code TEXT;
