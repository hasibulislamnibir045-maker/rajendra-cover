-- ===== Tuition tables (Supabase) :: Tutors + Posts =====
-- SQL Editor-e paste kore RUN korun. Ekbar-i hobe.

-- 1) Tutors (tutor registration/profile)
create table if not exists public.tutors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'active',        -- active | paused
  full_name text not null,
  mobile text,
  gender text,
  institution text,
  year text,
  subject text,
  class_level text,                              -- Class 6-10 / HSC / Honours...
  medium text,                                  -- Bangla / English / Both
  area text,
  mode text,                                    -- online | offline | both
  salary text,
  experience text,
  pin text
);

-- 2) Posts (tuition posts: guardian/student posts a vacancy)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'active',        -- active | closed
  full_name text not null,
  mobile text,
  class_level text,
  student_gender text,
  subject text,
  medium text,
  area text,
  days text,
  salary text,
  target text,
  note text,
  pin text
);

-- 3) RLS on (public read, owner write)
alter table public.tutors enable row level security;
alter table public.posts   enable row level security;

create policy "tutors_public_read"  on public.tutors for select using (true);
create policy "tutors_owner_insert" on public.tutors for insert with check (auth.uid() = user_id);
create policy "tutors_owner_update"  on public.tutors for update using (auth.uid() = user_id);
create policy "posts_public_read"   on public.posts for select using (true);
create policy "posts_owner_insert"  on public.posts for insert with check (auth.uid() = user_id);
create policy "posts_owner_update"  on public.posts for update using (auth.uid() = user_id);

-- 4) Indexes
create index if not exists tutors_area_idx on public.tutors (area);
create index if not exists posts_area_idx  on public.posts (area);
