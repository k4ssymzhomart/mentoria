-- Mentoria Hub — Phase 0 schema: profiles, role enum, RLS, signup trigger.
-- Run once in the Supabase SQL editor (Dashboard → SQL). Safe to re-run.

-- 1) Role enum -------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('student', 'admin', 'mentor');
  end if;
end$$;

-- 2) Profiles table (1:1 with auth.users) ----------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  role        public.user_role not null default 'student',
  grade       int,
  interests   text[] not null default '{}',
  subjects    text[] not null default '{}',
  goals       text[] not null default '{}',
  locale      text not null default 'ru',
  onboarded   boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 3) Admin check -----------------------------------------------------------
-- SECURITY DEFINER avoids RLS recursion when policies need the caller's role.
create or replace function public.is_admin() returns boolean
  language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- 4) Row-level security policies (idempotent) ------------------------------
drop policy if exists "read own profile"   on public.profiles;
drop policy if exists "update own profile" on public.profiles;
drop policy if exists "admins read all"    on public.profiles;

create policy "read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);
create policy "admins read all"    on public.profiles for select using (public.is_admin());

-- 5) Auto-create a profile row on signup (Google OAuth or magic link) ------
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row
  execute function public.handle_new_user();

-- After your first sign-in, promote yourself:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
