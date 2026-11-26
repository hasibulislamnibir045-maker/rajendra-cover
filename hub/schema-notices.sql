-- ===== Rajendra Student Hub: Supabase migration (Hub Phase 1 - Notices) =====
-- Supabase Dashboard > SQL Editor > New query > ei puro SQL paste kore RUN din
-- Ekta Supabase project: Hut-er project-i, notun kichu lagbe na

-- 1) profiles table e admin flag jog (Hut-er existing table, safe)
alter table profiles add column if not exists is_admin boolean default false;

-- 2) Notices table
create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  title text not null,
  cat text default 'সাধারণ',
  dept text,
  body text,
  link text,
  created_by uuid
);

-- 3) Row Level Security: sobai porhte pare, sudhu logged-in admin likhte pare
alter table notices enable row level security;

drop policy if exists "notices read public" on notices;
create policy "notices read public" on notices for select using (true);

drop policy if exists "notices insert admin" on notices;
create policy "notices insert admin" on notices for insert
  with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- 4) admin profile set korar jonno (nijeke admin banate):
--    UPDATE profiles SET is_admin = true WHERE id = 'apnar-user-uuid';
--    (Supabase Dashboard > Authentication > Users theke id copy kore boshan)
