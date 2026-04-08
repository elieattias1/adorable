-- CRM leads table
create table if not exists leads (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,

  -- Business info
  business_name   text not null,
  website_url     text,
  email           text,
  phone           text,
  address         text,
  category        text,
  city            text,

  -- CRM state
  status          text not null default 'new'
                    check (status in ('new','contacted','building','built','closed')),
  notes           text,

  -- Linked SiteBot site (set when a site is built for this lead)
  site_id         uuid references sites(id) on delete set null,

  -- Scraped website metadata
  cms             text,
  page_title      text,
  meta_description text,
  og_image        text,

  -- Source tracking
  source          text default 'manual',  -- manual | csv_import | url_scrape

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- RLS
alter table leads enable row level security;

create policy "Users manage their own leads"
  on leads for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexes
create index leads_user_id_idx   on leads(user_id);
create index leads_status_idx    on leads(user_id, status);
create index leads_updated_idx   on leads(user_id, updated_at desc);

-- Auto-update updated_at
create or replace function update_leads_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_updated_at
  before update on leads
  for each row execute procedure update_leads_updated_at();
