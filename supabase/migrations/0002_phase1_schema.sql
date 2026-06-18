-- Mentoria Hub — Phase 1 schema (Migration 1 of 2). Run in the Supabase SQL editor.
-- Idempotent: safe to re-run. Depends on Phase 0 (profiles, is_admin()).

-- ============ ENUMS ============
do $$ begin
  if not exists (select 1 from pg_type where typname = 'opportunity_type') then
    create type public.opportunity_type as enum
      ('olympiad','hackathon','scholarship','internship','summer_school','research','volunteering','competition','conference');
  end if;
  if not exists (select 1 from pg_type where typname = 'opportunity_format') then
    create type public.opportunity_format as enum ('online','offline','hybrid');
  end if;
  if not exists (select 1 from pg_type where typname = 'course_difficulty') then
    create type public.course_difficulty as enum ('beginner','intermediate','advanced');
  end if;
end $$;
-- public.user_role ('student','admin','mentor') already exists from Phase 0.

-- ============ TAGS (dictionary only) ============
create table if not exists public.tags (
  slug  text primary key,
  kind  text not null check (kind in ('direction','subject')),
  label jsonb not null,                 -- {"en","ru","kk"}
  sort  int   not null default 0
);

-- ============ OPPORTUNITIES ============
create table if not exists public.opportunities (
  id           uuid primary key default gen_random_uuid(),
  title        jsonb not null,
  summary      jsonb,                   -- one line, for cards
  description  jsonb,                   -- detail page
  requirements jsonb,
  type         public.opportunity_type   not null,
  format       public.opportunity_format not null,
  tags         text[] not null default '{}',   -- slugs in public.tags
  grade_min    int,
  grade_max    int,
  deadline     date,
  location     text,
  organizer    text,
  apply_url    text,
  image_url    text,
  featured     boolean not null default false,
  is_published boolean not null default true,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists opportunities_tags_gin    on public.opportunities using gin (tags);
create index if not exists opportunities_deadline_idx on public.opportunities (deadline);
create index if not exists opportunities_type_idx     on public.opportunities (type);
create index if not exists opportunities_format_idx   on public.opportunities (format);

-- ============ COURSES ============
create table if not exists public.courses (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,    -- 'sat-ebrw','ielts','university-admissions'
  title        jsonb not null,
  summary      jsonb,
  description  jsonb,
  subject      text,                    -- 'sat','ielts','admissions'
  difficulty   public.course_difficulty not null default 'beginner',
  tags         text[] not null default '{}',
  estimated_hours numeric,
  cover_url    text,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists courses_tags_gin on public.courses using gin (tags);

-- ============ LESSONS ============
create table if not exists public.lessons (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  position     int  not null,
  title        jsonb not null,
  content_type text not null default 'text' check (content_type in ('text','video')),
  video_url    text,
  body         jsonb,                   -- markdown-ish per locale
  materials    jsonb not null default '[]',  -- [{ "label": {en,ru,kk}, "url": "..." }]
  duration_min int,
  created_at   timestamptz not null default now(),
  unique (course_id, position)
);
create index if not exists lessons_course_idx on public.lessons (course_id);

-- ============ QUIZZES (1 optional per lesson; questions embedded) ============
create table if not exists public.quizzes (
  id            uuid primary key default gen_random_uuid(),
  lesson_id     uuid not null unique references public.lessons(id) on delete cascade,
  title         jsonb,
  passing_score int not null default 70,
  questions     jsonb not null
);

-- ============ PER-USER STATE ============
create table if not exists public.enrollments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  course_id    uuid not null references public.courses(id)  on delete cascade,
  enrolled_at  timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, course_id)
);

create table if not exists public.lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  lesson_id    uuid not null references public.lessons(id)  on delete cascade,
  course_id    uuid not null references public.courses(id)  on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);
create index if not exists lesson_progress_user_course_idx on public.lesson_progress (user_id, course_id);

create table if not exists public.quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  quiz_id      uuid not null references public.quizzes(id)  on delete cascade,
  score        int  not null,
  passed       boolean not null,
  answers      jsonb,
  attempted_at timestamptz not null default now()
);

create table if not exists public.saved_opportunities (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id)      on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  status         text not null default 'saved' check (status in ('saved','applied')),
  saved_at       timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

create table if not exists public.certificates (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id)  on delete cascade,
  serial    text unique not null,
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.roadmap_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  grade      int  not null check (grade between 9 and 12),
  position   int  not null default 0,
  kind       text not null check (kind in ('course','opportunity','milestone')),
  ref_id     uuid,
  title      jsonb,
  status     text not null default 'todo' check (status in ('todo','in_progress','done')),
  created_at timestamptz not null default now()
);
create index if not exists roadmap_user_grade_idx on public.roadmap_items (user_id, grade);

-- ============ updated_at triggers ============
create or replace function public.set_updated_at() returns trigger
  language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_opportunities_updated on public.opportunities;
create trigger trg_opportunities_updated before update on public.opportunities
  for each row execute function public.set_updated_at();

drop trigger if exists trg_courses_updated on public.courses;
create trigger trg_courses_updated before update on public.courses
  for each row execute function public.set_updated_at();
