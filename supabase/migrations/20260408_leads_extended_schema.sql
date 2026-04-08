-- Extend leads table with full Google Maps export schema
alter table leads
  add column if not exists arrondissement  text,
  add column if not exists postcode        text,
  add column if not exists departement     text,
  add column if not exists rating          numeric(3,1),
  add column if not exists reviews         integer,
  add column if not exists opening_hours   text,
  add column if not exists instagram       text,
  add column if not exists facebook        text,
  add column if not exists latitude        double precision,
  add column if not exists longitude       double precision,
  add column if not exists google_maps_url text,
  add column if not exists has_website     boolean,
  add column if not exists outreach_status text;

-- Spatial index for map queries
create index if not exists leads_location_idx
  on leads(user_id, latitude, longitude)
  where latitude is not null and longitude is not null;
