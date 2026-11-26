-- ===== Mess/Hostel table (Supabase) =====
create table if not exists public.mess (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'active',
  title text not null,
  cond text,
  g text,
  seats int,
  price text,
  area text,
  mobile text,
  loc text,
  note text
);
alter table public.mess enable row level security;
create policy "mess_public_read"  on public.mess for select using (true);
create policy "mess_owner_insert" on public.mess for insert with check (auth.uid() = user_id);
create policy "mess_owner_delete" on public.mess for delete using (auth.uid() = user_id);
create index if not exists mess_area_idx on public.mess (area);
