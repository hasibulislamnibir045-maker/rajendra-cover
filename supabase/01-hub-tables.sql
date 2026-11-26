-- ============================================================
-- Rajendra Student Hub :: Supabase schema (FRESH START, khali suru)
-- Kothay run korben: Supabase Dashboard > SQL Editor > New query > paste > Run
-- Eta kobarbar run korleo khoti hobe na (idempotent).
-- Ekhane kono purono Google Sheet-er data ashe na — sob khali thakbe.
-- ============================================================

-- 1) Hut-er 'profiles' table e admin flag jog (existing table, khoti hobe na)
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- admin check helper function
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) $$;

-- 2) নোটিশ
create table if not exists public.notices (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text,
  category    text not null default 'সাধারণ',
  dept        text,
  link        text,
  notice_date date not null default current_date,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

-- 3) রিসোর্স (prashno/sillabus/sajeshon link)
create table if not exists public.resources (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  dept       text,
  yr         text,
  type       text not null default 'নোট',
  url        text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- 4) ক্লাস রুটিন
create table if not exists public.routines (
  id         uuid primary key default gen_random_uuid(),
  dept       text not null default 'all',
  prog       text,
  yr         text,
  sub        text not null,
  kind       text not null default 'class' check (kind in ('class','exam','holiday')),
  date       text,
  rep        integer check (rep between 0 and 6),
  st         text,
  en         text,
  tch        text,
  room       text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- 5) RLS on (public read, admin-only write)
alter table public.notices   enable row level security;
alter table public.resources enable row level security;
alter table public.routines  enable row level security;

drop policy if exists "hub read notices"   on public.notices;
drop policy if exists "hub read resources" on public.resources;
drop policy if exists "hub read routines"  on public.routines;
create policy "hub read notices"   on public.notices   for select using (true);
create policy "hub read resources" on public.resources for select using (true);
create policy "hub read routines"  on public.routines  for select using (true);

drop policy if exists "hub admin ins notices"   on public.notices;
drop policy if exists "hub admin upd notices"   on public.notices;
drop policy if exists "hub admin del notices"   on public.notices;
drop policy if exists "hub admin ins resources" on public.resources;
drop policy if exists "hub admin upd resources" on public.resources;
drop policy if exists "hub admin del resources" on public.resources;
drop policy if exists "hub admin ins routines"  on public.routines;
drop policy if exists "hub admin upd routines"  on public.routines;
drop policy if exists "hub admin del routines"  on public.routines;
create policy "hub admin ins notices"   on public.notices   for insert with check (public.is_admin());
create policy "hub admin upd notices"   on public.notices   for update using (public.is_admin());
create policy "hub admin del notices"   on public.notices   for delete using (public.is_admin());
create policy "hub admin ins resources" on public.resources for insert with check (public.is_admin());
create policy "hub admin upd resources" on public.resources for update using (public.is_admin());
create policy "hub admin del resources" on public.resources for delete using (public.is_admin());
create policy "hub admin ins routines"  on public.routines  for insert with check (public.is_admin());
create policy "hub admin upd routines"  on public.routines  for update using (public.is_admin());
create policy "hub admin del routines"  on public.routines  for delete using (public.is_admin());

-- 6) NIJEKE admin banate: nicher line e NIJER login email bosiye abar Run korun
-- update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'your-email@example.com');
