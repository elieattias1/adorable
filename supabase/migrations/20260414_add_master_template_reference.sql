-- Registers the master boulangerie site as a reference template.
-- The react_code is populated at runtime by the clone-leads script / reference fetcher.
-- Run this once in the Supabase SQL Editor.

INSERT INTO reference_sites (slug, name, url, industry, site_type, tags, fonts, has_dark_bg, cta_texts, quality_score)
VALUES (
  'boul-master-adorable',
  'Boulangerie Master (Adorable)',
  'https://adorable.click/s/2c183759-85ed-46c3-99c9-cf39218ee0c1',
  'Boulangerie',
  'business',
  ARRAY['boulangerie', 'artisan', 'boutique', 'commande', 'val-doise'],
  ARRAY['Playfair Display', 'Inter'],
  false,
  ARRAY['Commander maintenant', 'Voir nos produits', 'Nous contacter'],
  9
)
ON CONFLICT (slug) DO UPDATE SET
  url          = EXCLUDED.url,
  quality_score = EXCLUDED.quality_score;
