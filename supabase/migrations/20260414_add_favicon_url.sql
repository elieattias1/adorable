alter table sites add column if not exists favicon_url text;

-- Pre-populate croissant for all existing bakery sites
update sites set favicon_url = 'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/72x72/1f950.png'
where type = 'bakery' and favicon_url is null;
