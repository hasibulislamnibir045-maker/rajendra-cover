-- ============================================================================
-- Rajendra Student Hub :: TUITION MARKETPLACE v2  (supabase/migrations/0001)
-- ============================================================================
-- KIVABE RUN KORBEN:
--   Supabase Dashboard > SQL Editor > New query > FULL file ta paste > Run
--   Eta idempotent — koyekbar run korleo existing data khoti hobe na.
--   Purono tutors/posts tables-er data-er upor ei script haath dake na.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0) Helper: admin check (already exists in 01-hub-tables.sql; re-created here
--    so ekta fresh project eo migration ta ekbar-e chole)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) $$;

-- Helper: tutor profile id for current user (RLS policies e use hoy)
create or replace function public.my_tutor_profile_id()
returns uuid language sql stable security definer set search_path = public as
$$ select id from public.tutor_profiles where user_id = auth.uid() limit 1 $$;

-- Helper: owner user_id of a tuition post (RLS policies e use hoy)
create or replace function public.post_owner(p_pid uuid)
returns uuid language sql stable security definer set search_path = public as
$$ select user_id from public.tuition_posts where id = p_pid $$;

-- ---------------------------------------------------------------------------
-- 1) tutor_profiles  (existing hub users ekhane "tutor" role e register korun)
--    status: pending | verified | rejected | suspended
-- ---------------------------------------------------------------------------
create table if not exists public.tutor_profiles (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  user_id             uuid not null unique references auth.users(id) on delete cascade,
  status              text not null default 'pending'
                      check (status in ('pending','verified','rejected','suspended')),
  full_name           text not null,
  photo_url           text,
  phone               text,
  gender              text check (gender in ('male','female','other')),
  institution         text,
  department          text,
  academic_level      text,              -- SSC/HSC/Honours/Masters ...
  previous_result     text,
  experience          text,
  subjects            text[],           -- {Physics, Higher Math}
  preferred_classes   text[],
  preferred_areas     text[],
  district            text,
  teaching_mode       text default 'both' check (teaching_mode in ('home','online','group','both')),
  expected_salary     text,
  teaching_method     text,
  bio                 text,
  featured            boolean not null default false,
  rating              numeric(3,2) default 0,
  verified_at         timestamptz,
  rejected_reason     text
);
create index if not exists tutor_profiles_status_idx on public.tutor_profiles (status);
create index if not exists tutor_profiles_district_idx on public.tutor_profiles (district);
create index if not exists tutor_profiles_featured_idx on public.tutor_profiles (featured, created_at desc);

-- ---------------------------------------------------------------------------
-- 2) tuition_posts  (guardian/student der pryojon)
--    status: pending | approved | rejected | filled | closed | expired
-- ---------------------------------------------------------------------------
create table if not exists public.tuition_posts (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  status              text not null default 'pending'
                      check (status in ('pending','approved','rejected','filled','closed','expired')),
  student_name        text,
  class_level         text not null,
  institution         text,
  subjects            text[] not null,
  medium              text not null default 'Bangla'
                      check (medium in ('Bangla','English','English Version')),
  district            text not null,
  area                text not null,
  address_private     text,             -- PUBLICLY DISPLAYED HOCHE NA
  salary              numeric not null,
  days_per_week       int not null default 3 check (days_per_week between 1 and 7),
  hours_per_day       numeric default 1.5,
  student_gender      text,
  tutor_gender_pref   text,
  category            text not null default 'home' check (category in ('home','online','group')),
  requirements        text,
  contact_phone       text,             -- sirfakri: approved hoar pore owner-ke dekha jay
  contact_email       text,
  approved_at         timestamptz,
  rejected_reason     text,
  closed_at          timestamptz
);
create index if not exists tuition_posts_status_idx on public.tuition_posts (status, created_at desc);
create index if not exists tuition_posts_district_idx on public.tuition_posts (district);
create index if not exists tuition_posts_area_idx on public.tuition_posts (area);
create index if not exists tuition_posts_salary_idx on public.tuition_posts (salary);
create index if not exists tuition_posts_class_idx on public.tuition_posts (class_level);
create index if only exists is a false; -- guard
