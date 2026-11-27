-- ============================================================================
-- TUITION MARKETPLACE v2 :: Migration 1/4 - CORE TABLES
-- RUN ORDER (Supabase Dashboard > SQL Editor, one by one):
--   0001_tuition_marketplace.sql        (this file - core tables)
--   0002_tuition_flows.sql              (applications, saved, notifications, reports)
--   0003_tuition_rls.sql                (Row Level Security policies)
--   0004_tuition_triggers_storage.sql   (notification triggers + private bucket)
-- Idempotent - safe to run multiple times. Does not touch legacy tutors/posts.
-- ============================================================================

-- Helper: admin check (also exists in 01-hub-tables.sql; safe re-create)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) $$;

-- Helper: owner user_id of a tuition post (used in RLS)
create or replace function public.post_owner_id(p_pid uuid)
returns uuid language sql stable security definer set search_path = public as
$$ select user_id from public.tuition_posts where id = p_pid $$;

-- 1) tutor_profiles  (status: pending | verified | rejected | suspended)
create table if not exists public.tutor_profiles (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  user_id           uuid not null unique references auth.users(id) on delete cascade,
  status            text not null default 'pending'
                    check (status in ('pending','verified','rejected','suspended')),
  full_name         text not null,
  photo_url         text,
  phone             text,
  gender            text check (gender in ('male','female','other')),
  institution       text,
  department        text,
  academic_level    text,
  previous_result   text,
  experience        text,
  subjects          text[],
  preferred_classes text[],
  preferred_areas   text[],
  district          text,
  teaching_mode     text not null default 'both'
                    check (teaching_mode in ('home','online','group','both')),
  expected_salary   text,
  teaching_method   text,
  bio               text,
  featured          boolean not null default false,
  verified_at       timestamptz,
  rejected_reason   text
);
create index if not exists tp_status_idx   on public.tutor_profiles (status);
create index if not exists tp_district_idx on public.tutor_profiles (district);
create index if not exists tp_featured_idx on public.tutor_profiles (featured, created_at desc);

-- 2) tuition_posts (status: pending|approved|rejected|filled|closed|expired)
create table if not exists public.tuition_posts (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  status            text not null default 'pending'
                    check (status in ('pending','approved','rejected','filled','closed','expired')),
  student_name      text,
  class_level       text not null,
  institution       text,
  subjects          text[] not null,
  medium            text not null default 'Bangla'
                    check (medium in ('Bangla','English','English Version')),
  district          text not null,
  area              text not null,
  address_private   text,
  salary            numeric not null check (salary >= 0),
  days_per_week     int not null default 3 check (days_per_week between 1 and 7),
  hours_per_day     numeric default 1.5,
  student_gender    text,
  tutor_gender_pref text,
  category          text not null default 'home' check (category in ('home','online','group')),
  requirements      text,
  contact_phone     text,
  contact_email     text,
  approved_at       timestamptz,
  rejected_reason   text,
  closed_at         timestamptz
);
create index if not exists tq_status_idx   on public.tuition_posts (status, created_at desc);
create index if not exists tq_district_idx on public.tuition_posts (district);
create index if not exists tq_area_idx     on public.tuition_posts (area);
create index if not exists tq_salary_idx   on public.tuition_posts (salary);
create index if not exists tq_class_idx    on public.tuition_posts (class_level);
