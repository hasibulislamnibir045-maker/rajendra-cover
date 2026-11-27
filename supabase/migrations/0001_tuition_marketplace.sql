-- ============================================================================
-- TUITION MARKETPLACE :: Migration 1 - CORE TABLES
-- Run in Supabase SQL Editor first.
-- ============================================================================

-- -------------------------------------------------------------
-- 0) is_admin helper FIRST (used by RLS policies below)
--    matches hubdb.js: profiles.is_admin boolean
-- -------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin is true
  );
$$;

-- -------------------------------------------------------------
-- 1) TUTOR PROFILES
-- -------------------------------------------------------------
create table if not exists public.tutor_profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references auth.users(id) on delete cascade,
  full_name           text not null,
  phone               text,
  institution         text,
  experience          numeric(4,1) default 0,
  subjects            text,
  areas               text,
  bio                 text,
  document_path       text,
  verification_status text not null default 'pending'
                      check (verification_status in ('pending','verified','rejected')),
  featured            boolean not null default false,
  suspended           boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_tutor_profiles_status
  on public.tutor_profiles (verification_status, suspended);

-- -------------------------------------------------------------
-- 2) TUITION POSTS
-- -------------------------------------------------------------
create table if not exists public.tuition_posts (
  id            uuid primary key default gen_random_uuid(),
  created_by    uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  category      text not null,
  class_level   text,
  subjects      text not null,
  medium        text,
  area          text,
  days          text,
  salary        numeric(10,2),
  verified_only boolean not null default false,
  description   text,
  address       text,
  contact_phone text,
  status        text not null default 'pending'
                check (status in ('pending','approved','rejected','filled','closed','expired')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_tuition_posts_status
  on public.tuition_posts (status, created_at desc);
create index if not exists idx_tuition_posts_category
  on public.tuition_posts (category, status);
create index if not exists idx_tuition_posts_salary
  on public.tuition_posts (salary);

-- -------------------------------------------------------------
-- 3) updated_at helper + triggers
-- -------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_tutor_profile on public.tutor_profiles;
create trigger trg_touch_tutor_profile
  before update on public.tutor_profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_tuition_post on public.tuition_posts;
create trigger trg_touch_tuition_post
  before update on public.tuition_posts
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------------
-- 4) RLS on core tables
-- -------------------------------------------------------------
alter table public.tutor_profiles enable row level security;
alter table public.tuition_posts   enable row level security;

-- tutor reads/updates own profile
create policy "tutor own profile" on public.tutor_profiles
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- public read of approved posts
create policy "approved posts public read" on public.tuition_posts
  for select using (status = 'approved');

-- admin full access to posts
create policy "admin all posts" on public.tuition_posts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- post owner full access to own posts
create policy "owner all own posts" on public.tuition_posts
  for all to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());
