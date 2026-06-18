-- Phase 7 deploy fix: make OAuth-created profiles reliably default to student.
-- Safe to re-run.

alter table public.profiles
  alter column role set default 'student'::public.user_role;

create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    'student'::public.user_role
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop policy if exists "insert own student profile" on public.profiles;
create policy "insert own student profile"
  on public.profiles
  for insert
  with check (auth.uid() = id and role = 'student'::public.user_role);
