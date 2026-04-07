-- ═══════════════════════════════════════════════════════════════════════════
-- SiteBot — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Enable extensions ────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with app-specific fields
create table public.profiles (
  id                    uuid references auth.users(id) on delete cascade primary key,
  email                 text,
  full_name             text,
  avatar_url            text,
  plan                  text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  stripe_customer_id    text unique,
  stripe_subscription_id text,
  subscription_status   text,   -- 'active' | 'canceled' | 'past_due' | null
  subscription_ends_at  timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── SITES ────────────────────────────────────────────────────────────────────
create table public.sites (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  type         text not null default 'blank'
               check (type in ('business', 'portfolio', 'restaurant', 'shop', 'blog', 'blank', 'saas', 'landing')),
  html         text,                          -- current HTML content
  deployed_url text,                          -- e.g. https://mysite.vercel.app
  custom_domain text,                         -- e.g. mysite.com (pro only)
  is_published  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── MESSAGES ─────────────────────────────────────────────────────────────────
-- Chat history per site
create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid references public.sites(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

-- ─── VERSIONS ─────────────────────────────────────────────────────────────────
-- Snapshot of HTML after each AI edit
create table public.versions (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid references public.sites(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  html       text not null,
  note       text,          -- e.g. "Added contact form"
  created_at timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.sites    enable row level security;
alter table public.messages enable row level security;
alter table public.versions enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Sites: users can CRUD their own sites
create policy "Users can view own sites"   on public.sites for select using (auth.uid() = user_id);
create policy "Users can insert own sites" on public.sites for insert with check (auth.uid() = user_id);
create policy "Users can update own sites" on public.sites for update using (auth.uid() = user_id);
create policy "Users can delete own sites" on public.sites for delete using (auth.uid() = user_id);

-- Messages: users can CRUD their own
create policy "Users can view own messages"   on public.messages for select using (auth.uid() = user_id);
create policy "Users can insert own messages" on public.messages for insert with check (auth.uid() = user_id);

-- Versions: users can CRUD their own
create policy "Users can view own versions"   on public.versions for select using (auth.uid() = user_id);
create policy "Users can insert own versions" on public.versions for insert with check (auth.uid() = user_id);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index idx_sites_user_id     on public.sites(user_id);
create index idx_messages_site_id  on public.messages(site_id);
create index idx_versions_site_id  on public.versions(site_id);
create index idx_profiles_stripe   on public.profiles(stripe_customer_id);

-- ─── Updated_at trigger ───────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;

create trigger sites_updated_at before update on public.sites for each row execute procedure update_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute procedure update_updated_at();

-- ─── Plan limits view ─────────────────────────────────────────────────────────
create or replace view public.user_limits as
select
  p.id,
  p.plan,
  count(distinct s.id) as site_count,
  case p.plan
    when 'free'        then 1
    when 'pro'         then 999
    when 'enterprise'  then 9999
    else 1
  end as max_sites,
  case p.plan
    when 'free' then false
    else true
  end as can_use_custom_domain
from public.profiles p
left join public.sites s on s.user_id = p.id
group by p.id, p.plan;
