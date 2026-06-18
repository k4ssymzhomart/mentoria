# Mentoria Hub — Phase 1: Data Model & Seed

**Goal of Phase 1:** define and migrate the full database, lock the TypeScript contract every later phase codes against, and load realistic seed content so the product has something to render. When Phase 1 is done, the database has all tables + RLS + helper functions, the `DataProvider` contract is implemented for catalog reads, recommendations, and student state, and the catalog is populated with **10 opportunities** and **3 courses (EBRW SAT, IELTS, University Admissions)** with lessons and quizzes in RU / EN (and KK drafts).

> **Depends on Phase 0:** `profiles` table, `is_admin()`, the Supabase clients, and the `lib/data/provider.ts` scaffold must already exist.

---

## 1. Data-modeling decisions (the "why," so the schema reads clearly)

1. **Translatable text is JSONB, not columns.** Every user-facing string on a content row (`title`, `summary`, `description`, lesson `body`, quiz prompts) is a JSONB object `{ "en": "...", "ru": "...", "kk": "..." }`. The app reads `field[locale]`. Adding a 4th language later needs **zero** schema change, and the admin form is just three inputs per field. UI chrome strings stay in `messages/*.json` (Phase 0); **content** strings live on the rows so admins can localize without a deploy.
2. **Tags are arrays of slugs; a `tags` table is the dictionary only.** Each opportunity/course carries `tags text[]` (slugs). The `tags` table holds the controlled vocabulary (slug → kind → trilingual label) used to render filter chips, populate admin dropdowns, and localize labels. Membership lives **only** in the arrays — one source of truth — so no sync bugs. Recommendation = array overlap (`&&`) against `profiles.interests`, made fast by GIN indexes. This is the "tags or simple logic" the brief asks for, done the scalable way.
3. **Single-valued facets are columns/enums, not tags.** `type`, `format`, `grade_min/max`, `deadline` are their own columns because each maps to a distinct filter and is single-valued. Tags carry only the multi-valued thematic dimensions (direction + subject) that drive recommendations.
4. **Public catalog is anon-readable via RLS; everything else is owner- or admin-scoped.** Published opportunities/courses/lessons/quizzes are readable by anyone (so visitors see a teaser). Per-user rows (saves, enrollments, progress, attempts, certificates, roadmap) are readable/writable only by their owner, plus read-all for admins. Sensitive operations (grading a quiz, issuing a certificate) run through `SECURITY DEFINER` RPCs so correct answers never reach the client and certificates can't be forged.
5. **Recommendation, quiz grading, and certificate issuance are Postgres functions (RPCs).** Keeps the logic server-side, fast, and tamper-resistant, and reads as genuinely scalable to technical judges.

---

## 2. Schema (run in Supabase SQL editor — Migration 1 of 3)

```sql
-- ============ ENUMS ============
create type public.opportunity_type as enum
  ('olympiad','hackathon','scholarship','internship','summer_school','research','volunteering','competition','conference');
create type public.opportunity_format as enum ('online','offline','hybrid');
create type public.course_difficulty   as enum ('beginner','intermediate','advanced');
-- public.user_role ('student','admin','mentor') already exists from Phase 0.

-- ============ TAGS (dictionary only) ============
create table public.tags (
  slug  text primary key,
  kind  text not null check (kind in ('direction','subject')),
  label jsonb not null,                 -- {"en","ru","kk"}
  sort  int   not null default 0
);

-- ============ OPPORTUNITIES ============
create table public.opportunities (
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
create index opportunities_tags_gin     on public.opportunities using gin (tags);
create index opportunities_deadline_idx  on public.opportunities (deadline);
create index opportunities_type_idx      on public.opportunities (type);
create index opportunities_format_idx    on public.opportunities (format);

-- ============ COURSES ============
create table public.courses (
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
create index courses_tags_gin on public.courses using gin (tags);

-- ============ LESSONS ============
create table public.lessons (
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
create index lessons_course_idx on public.lessons (course_id);

-- ============ QUIZZES (1 optional per lesson; questions embedded) ============
create table public.quizzes (
  id            uuid primary key default gen_random_uuid(),
  lesson_id     uuid not null unique references public.lessons(id) on delete cascade,
  title         jsonb,
  passing_score int not null default 70,
  -- [{ "id":"q1", "prompt":{en,ru,kk}, "options":[{"id":"a","label":{en,ru,kk}}...], "correct":"a" }]
  questions     jsonb not null
);

-- ============ PER-USER STATE ============
create table public.enrollments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  course_id    uuid not null references public.courses(id)  on delete cascade,
  enrolled_at  timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, course_id)
);

create table public.lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  lesson_id    uuid not null references public.lessons(id)  on delete cascade,
  course_id    uuid not null references public.courses(id)  on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);
create index lesson_progress_user_course_idx on public.lesson_progress (user_id, course_id);

create table public.quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  quiz_id      uuid not null references public.quizzes(id)  on delete cascade,
  score        int  not null,
  passed       boolean not null,
  answers      jsonb,
  attempted_at timestamptz not null default now()
);

create table public.saved_opportunities (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id)      on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  status         text not null default 'saved' check (status in ('saved','applied')),
  saved_at       timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

create table public.certificates (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id)  on delete cascade,
  serial    text unique not null,
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table public.roadmap_items (
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
create index roadmap_user_grade_idx on public.roadmap_items (user_id, grade);

-- ============ updated_at triggers ============
create or replace function public.set_updated_at() returns trigger
  language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger trg_opportunities_updated before update on public.opportunities
  for each row execute function public.set_updated_at();
create trigger trg_courses_updated before update on public.courses
  for each row execute function public.set_updated_at();
```

---

## 3. RLS + RPCs (run in Supabase SQL editor — Migration 2 of 3)

```sql
-- ============ ENABLE RLS ============
alter table public.tags                enable row level security;
alter table public.opportunities       enable row level security;
alter table public.courses             enable row level security;
alter table public.lessons             enable row level security;
alter table public.quizzes             enable row level security;
alter table public.enrollments         enable row level security;
alter table public.lesson_progress     enable row level security;
alter table public.quiz_attempts       enable row level security;
alter table public.saved_opportunities enable row level security;
alter table public.certificates        enable row level security;
alter table public.roadmap_items       enable row level security;

-- ============ PUBLIC CATALOG (read), ADMIN (write) ============
create policy "tags read"        on public.tags for select using (true);
create policy "tags admin write" on public.tags for all using (public.is_admin()) with check (public.is_admin());

create policy "opps read"        on public.opportunities for select using (is_published or public.is_admin());
create policy "opps admin write" on public.opportunities for all using (public.is_admin()) with check (public.is_admin());

create policy "courses read"        on public.courses for select using (is_published or public.is_admin());
create policy "courses admin write" on public.courses for all using (public.is_admin()) with check (public.is_admin());

create policy "lessons read" on public.lessons for select using (
  public.is_admin() or exists (select 1 from public.courses c where c.id = lessons.course_id and c.is_published));
create policy "lessons admin write" on public.lessons for all using (public.is_admin()) with check (public.is_admin());

create policy "quizzes read" on public.quizzes for select using (
  public.is_admin() or exists (
    select 1 from public.lessons l join public.courses c on c.id = l.course_id
    where l.id = quizzes.lesson_id and c.is_published));
create policy "quizzes admin write" on public.quizzes for all using (public.is_admin()) with check (public.is_admin());

-- ============ PER-USER ROWS: owner full access + admin read-all ============
-- enrollments
create policy "own enrollments"   on public.enrollments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin read enroll" on public.enrollments for select using (public.is_admin());
-- lesson_progress
create policy "own progress"      on public.lesson_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin read prog"   on public.lesson_progress for select using (public.is_admin());
-- quiz_attempts (insert happens via grade_quiz RPC; owner may read)
create policy "own attempts"      on public.quiz_attempts for select using (auth.uid() = user_id);
create policy "admin read att"    on public.quiz_attempts for select using (public.is_admin());
-- saved_opportunities
create policy "own saved"         on public.saved_opportunities for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin read saved"  on public.saved_opportunities for select using (public.is_admin());
-- certificates (insert via issue_certificate RPC; owner may read)
create policy "own certs"         on public.certificates for select using (auth.uid() = user_id);
create policy "admin read certs"  on public.certificates for select using (public.is_admin());
-- roadmap_items
create policy "own roadmap"       on public.roadmap_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin read roadmap" on public.roadmap_items for select using (public.is_admin());

-- ============ RECOMMENDATION RPCs (respect RLS; not security definer) ============
create or replace function public.recommend_opportunities(p_interests text[], p_grade int, p_limit int default 8)
returns setof public.opportunities language sql stable as $$
  select o.* from public.opportunities o
  where o.is_published
    and (p_grade is null
         or ((o.grade_min is null or o.grade_min <= p_grade)
         and (o.grade_max is null or o.grade_max >= p_grade)))
    and (cardinality(p_interests) = 0 or o.tags && p_interests)
  order by cardinality(array(select unnest(o.tags) intersect select unnest(p_interests))) desc,
           o.deadline asc nulls last
  limit p_limit;
$$;

create or replace function public.recommend_courses(p_interests text[], p_limit int default 6)
returns setof public.courses language sql stable as $$
  select c.* from public.courses c
  where c.is_published
    and (cardinality(p_interests) = 0 or c.tags && p_interests)
  order by cardinality(array(select unnest(c.tags) intersect select unnest(p_interests))) desc,
           c.created_at desc
  limit p_limit;
$$;

-- ============ QUIZ GRADING (security definer: answers never leave the server) ============
create or replace function public.grade_quiz(p_quiz_id uuid, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_q jsonb; v_pass int; q jsonb;
        v_total int := 0; v_correct int := 0; v_score int; v_passed boolean;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  select questions, passing_score into v_q, v_pass from public.quizzes where id = p_quiz_id;
  if v_q is null then raise exception 'quiz not found'; end if;
  for q in select * from jsonb_array_elements(v_q) loop
    v_total := v_total + 1;
    if (p_answers ->> (q->>'id')) is not distinct from (q->>'correct') then
      v_correct := v_correct + 1;
    end if;
  end loop;
  v_score  := case when v_total = 0 then 0 else round(100.0 * v_correct / v_total) end;
  v_passed := v_score >= v_pass;
  insert into public.quiz_attempts (user_id, quiz_id, score, passed, answers)
  values (v_user, p_quiz_id, v_score, v_passed, p_answers);
  return jsonb_build_object('score', v_score, 'passed', v_passed, 'total', v_total, 'correct', v_correct);
end; $$;

-- ============ CERTIFICATE ISSUANCE (security definer: verifies completion) ============
create or replace function public.issue_certificate(p_course_id uuid)
returns public.certificates language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_total int; v_done int; v_cert public.certificates; v_serial text;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  select count(*) into v_total from public.lessons         where course_id = p_course_id;
  select count(*) into v_done  from public.lesson_progress where course_id = p_course_id and user_id = v_user;
  if v_total = 0 or v_done < v_total then raise exception 'course not completed'; end if;
  update public.enrollments set completed_at = now()
    where user_id = v_user and course_id = p_course_id and completed_at is null;
  v_serial := 'MH-' || to_char(now(),'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.certificates (user_id, course_id, serial)
  values (v_user, p_course_id, v_serial)
  on conflict (user_id, course_id) do update set issued_at = public.certificates.issued_at
  returning * into v_cert;
  return v_cert;
end; $$;
```

---

## 4. TypeScript types — `src/lib/data/types.ts`

```ts
export type Locale = 'ru' | 'en' | 'kk';
export type Localized = Record<Locale, string>;

export type OpportunityType =
  | 'olympiad' | 'hackathon' | 'scholarship' | 'internship'
  | 'summer_school' | 'research' | 'volunteering' | 'competition' | 'conference';
export type OpportunityFormat = 'online' | 'offline' | 'hybrid';
export type CourseDifficulty  = 'beginner' | 'intermediate' | 'advanced';
export type TagKind = 'direction' | 'subject';

export interface Tag { slug: string; kind: TagKind; label: Localized; sort: number; }

export interface Opportunity {
  id: string; title: Localized; summary: Localized | null; description: Localized | null;
  requirements: Localized | null; type: OpportunityType; format: OpportunityFormat;
  tags: string[]; grade_min: number | null; grade_max: number | null; deadline: string | null;
  location: string | null; organizer: string | null; apply_url: string | null;
  image_url: string | null; featured: boolean; is_published: boolean; created_at: string;
}

export interface Material { label: Localized; url: string; }
export interface Lesson {
  id: string; course_id: string; position: number; title: Localized;
  content_type: 'text' | 'video'; video_url: string | null; body: Localized | null;
  materials: Material[]; duration_min: number | null;
}
export interface QuizOption { id: string; label: Localized; }
export interface QuizQuestion { id: string; prompt: Localized; options: QuizOption[]; correct?: string; } // `correct` stripped before client
export interface Quiz { id: string; lesson_id: string; title: Localized | null; passing_score: number; questions: QuizQuestion[]; }

export interface Course {
  id: string; slug: string; title: Localized; summary: Localized | null; description: Localized | null;
  subject: string | null; difficulty: CourseDifficulty; tags: string[];
  estimated_hours: number | null; cover_url: string | null; is_published: boolean; created_at: string;
}
export type CourseWithLessons = Course & { lessons: Lesson[] };
export type LessonForLearner  = Lesson & { quiz: Omit<Quiz, 'questions'> & { questions: Omit<QuizQuestion,'correct'>[] } | null };

export interface SavedOpportunity { id: string; opportunity_id: string; status: 'saved' | 'applied'; saved_at: string; opportunity?: Opportunity; }
export interface EnrollmentWithProgress { course: Course; enrolled_at: string; completed_at: string | null; completed: number; total: number; pct: number; }
export interface Certificate { id: string; course_id: string; serial: string; issued_at: string; }
export interface RoadmapItem { id: string; grade: number; position: number; kind: 'course' | 'opportunity' | 'milestone'; ref_id: string | null; title: Localized | null; status: 'todo' | 'in_progress' | 'done'; }

export interface OpportunityFilters {
  search?: string; types?: OpportunityType[]; formats?: OpportunityFormat[];
  tags?: string[]; grade?: number; deadlineBefore?: string;
  sort?: 'deadline' | 'newest'; page?: number; pageSize?: number;
}

// helper for components
export const t = (val: Localized | null | undefined, locale: Locale, fallback: Locale = 'en') =>
  val ? (val[locale] || val[fallback] || '') : '';
```

---

## 5. The DataProvider contract — `src/lib/data/provider.ts`

```ts
import type {
  Opportunity, OpportunityFilters, Course, CourseWithLessons, LessonForLearner, Tag,
  SavedOpportunity, EnrollmentWithProgress, Certificate, RoadmapItem,
} from './types';

export interface DataProvider {
  // ---- Catalog (public) ---- [consumed: Phase 2 & 3]
  getTags(): Promise<Tag[]>;
  listOpportunities(f: OpportunityFilters): Promise<{ items: Opportunity[]; total: number }>;
  getOpportunity(id: string): Promise<Opportunity | null>;
  listCourses(): Promise<Course[]>;
  getCourseBySlug(slug: string): Promise<CourseWithLessons | null>;
  getLessonForLearner(courseSlug: string, lessonId: string): Promise<LessonForLearner | null>;

  // ---- Personalization ---- [consumed: Phase 4 & 5]
  recommendOpportunities(interests: string[], grade: number | null, limit?: number): Promise<Opportunity[]>;
  recommendCourses(interests: string[], limit?: number): Promise<Course[]>;

  // ---- Student state ---- [consumed: Phase 2,3,4]
  listSaved(userId: string): Promise<SavedOpportunity[]>;
  saveOpportunity(userId: string, opportunityId: string): Promise<void>;
  unsaveOpportunity(userId: string, opportunityId: string): Promise<void>;
  setOpportunityStatus(userId: string, opportunityId: string, status: 'saved' | 'applied'): Promise<void>;
  enroll(userId: string, courseId: string): Promise<void>;
  listEnrollments(userId: string): Promise<EnrollmentWithProgress[]>;
  getCourseProgress(userId: string, courseId: string): Promise<{ completed: number; total: number; pct: number }>;
  completeLesson(userId: string, lessonId: string, courseId: string): Promise<void>;
  gradeQuiz(quizId: string, answers: Record<string, string>): Promise<{ score: number; passed: boolean; total: number; correct: number }>;
  issueCertificate(courseId: string): Promise<Certificate>;
  listCertificates(userId: string): Promise<Certificate[]>;

  // ---- Roadmap ---- [consumed: Phase 4]
  getRoadmap(userId: string): Promise<RoadmapItem[]>;
  upsertRoadmapItem(item: Partial<RoadmapItem> & { grade: number; kind: RoadmapItem['kind'] }): Promise<void>;
  deleteRoadmapItem(id: string): Promise<void>;

  // ---- Admin ---- [consumed: Phase 6 — signatures only here]
  adminUpsertOpportunity(input: Partial<Opportunity>): Promise<Opportunity>;
  adminDeleteOpportunity(id: string): Promise<void>;
  adminUpsertCourse(input: Partial<Course>): Promise<Course>;
  adminUpsertLesson(input: Partial<import('./types').Lesson>): Promise<void>;
  adminDeleteCourse(id: string): Promise<void>;
  adminStats(): Promise<{ users: number; opportunities: number; courses: number; enrollments: number; completions: number }>;
}

import { supabaseProvider } from './supabase-provider';
export const db: DataProvider = supabaseProvider;
```

---

## 6. Supabase implementation — `src/lib/data/supabase-provider.ts`

> Phase 1 implements catalog reads, recommendations, and student state. Admin methods are stubbed with a clear throw and wired in Phase 6. All reads use the server client; call these from Server Components / Server Actions.

```ts
import 'server-only';
import { createClient } from '@/utils/supabase/server';
import type { DataProvider } from './provider';
import type { Opportunity, OpportunityFilters, Course, CourseWithLessons, LessonForLearner } from './types';

const SEARCH_COLS = (q: string) =>
  ['title->>en', 'title->>ru', 'summary->>en', 'summary->>ru']
    .map((c) => `${c}.ilike.%${q}%`).join(',');

export const supabaseProvider: DataProvider = {
  async getTags() {
    const s = await createClient();
    const { data } = await s.from('tags').select('*').order('sort');
    return data ?? [];
  },

  async listOpportunities(f: OpportunityFilters) {
    const s = await createClient();
    const pageSize = f.pageSize ?? 12;
    const page = f.page ?? 0;
    let q = s.from('opportunities').select('*', { count: 'exact' }).eq('is_published', true);
    if (f.search)  q = q.or(SEARCH_COLS(f.search));
    if (f.types?.length)   q = q.in('type', f.types);
    if (f.formats?.length) q = q.in('format', f.formats);
    if (f.tags?.length)    q = q.overlaps('tags', f.tags);
    if (f.deadlineBefore)  q = q.lte('deadline', f.deadlineBefore);
    if (f.grade != null) {
      q = q.or(`grade_min.is.null,grade_min.lte.${f.grade}`)
           .or(`grade_max.is.null,grade_max.gte.${f.grade}`);
    }
    q = f.sort === 'newest'
      ? q.order('created_at', { ascending: false })
      : q.order('deadline', { ascending: true, nullsFirst: false });
    q = q.range(page * pageSize, page * pageSize + pageSize - 1);
    const { data, count } = await q;
    return { items: (data ?? []) as Opportunity[], total: count ?? 0 };
  },

  async getOpportunity(id) {
    const s = await createClient();
    const { data } = await s.from('opportunities').select('*').eq('id', id).maybeSingle();
    return (data as Opportunity) ?? null;
  },

  async listCourses() {
    const s = await createClient();
    const { data } = await s.from('courses').select('*').eq('is_published', true).order('created_at');
    return (data ?? []) as Course[];
  },

  async getCourseBySlug(slug) {
    const s = await createClient();
    const { data } = await s.from('courses')
      .select('*, lessons(*)').eq('slug', slug).eq('is_published', true).maybeSingle();
    if (!data) return null;
    (data as any).lessons.sort((a: any, b: any) => a.position - b.position);
    return data as CourseWithLessons;
  },

  async getLessonForLearner(courseSlug, lessonId) {
    const s = await createClient();
    const { data } = await s.from('lessons')
      .select('*, courses!inner(slug), quizzes(*)')
      .eq('id', lessonId).eq('courses.slug', courseSlug).maybeSingle();
    if (!data) return null;
    const quiz = (data as any).quizzes?.[0] ?? null;
    if (quiz) quiz.questions = quiz.questions.map(({ correct, ...rest }: any) => rest); // strip answers
    return { ...(data as any), quiz } as LessonForLearner;
  },

  async recommendOpportunities(interests, grade, limit = 8) {
    const s = await createClient();
    const { data } = await s.rpc('recommend_opportunities', { p_interests: interests, p_grade: grade, p_limit: limit });
    return (data ?? []) as Opportunity[];
  },
  async recommendCourses(interests, limit = 6) {
    const s = await createClient();
    const { data } = await s.rpc('recommend_courses', { p_interests: interests, p_limit: limit });
    return (data ?? []) as Course[];
  },

  async listSaved(userId) {
    const s = await createClient();
    const { data } = await s.from('saved_opportunities')
      .select('*, opportunity:opportunities(*)').eq('user_id', userId).order('saved_at', { ascending: false });
    return (data ?? []) as any;
  },
  async saveOpportunity(userId, opportunityId) {
    const s = await createClient();
    await s.from('saved_opportunities').upsert({ user_id: userId, opportunity_id: opportunityId }, { onConflict: 'user_id,opportunity_id' });
  },
  async unsaveOpportunity(userId, opportunityId) {
    const s = await createClient();
    await s.from('saved_opportunities').delete().eq('user_id', userId).eq('opportunity_id', opportunityId);
  },
  async setOpportunityStatus(userId, opportunityId, status) {
    const s = await createClient();
    await s.from('saved_opportunities').upsert({ user_id: userId, opportunity_id: opportunityId, status }, { onConflict: 'user_id,opportunity_id' });
  },

  async enroll(userId, courseId) {
    const s = await createClient();
    await s.from('enrollments').upsert({ user_id: userId, course_id: courseId }, { onConflict: 'user_id,course_id' });
  },
  async listEnrollments(userId) {
    const s = await createClient();
    const { data } = await s.from('enrollments').select('*, course:courses(*)').eq('user_id', userId);
    const out = [];
    for (const e of data ?? []) {
      const p = await this.getCourseProgress(userId, (e as any).course_id);
      out.push({ course: (e as any).course, enrolled_at: (e as any).enrolled_at, completed_at: (e as any).completed_at, ...p });
    }
    return out as any;
  },
  async getCourseProgress(userId, courseId) {
    const s = await createClient();
    const { count: total } = await s.from('lessons').select('id', { count: 'exact', head: true }).eq('course_id', courseId);
    const { count: completed } = await s.from('lesson_progress').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('course_id', courseId);
    const c = completed ?? 0, tot = total ?? 0;
    return { completed: c, total: tot, pct: tot ? Math.round((c / tot) * 100) : 0 };
  },
  async completeLesson(userId, lessonId, courseId) {
    const s = await createClient();
    await s.from('lesson_progress').upsert({ user_id: userId, lesson_id: lessonId, course_id: courseId }, { onConflict: 'user_id,lesson_id' });
  },
  async gradeQuiz(quizId, answers) {
    const s = await createClient();
    const { data, error } = await s.rpc('grade_quiz', { p_quiz_id: quizId, p_answers: answers });
    if (error) throw error;
    return data as any;
  },
  async issueCertificate(courseId) {
    const s = await createClient();
    const { data, error } = await s.rpc('issue_certificate', { p_course_id: courseId });
    if (error) throw error;
    return data as any;
  },
  async listCertificates(userId) {
    const s = await createClient();
    const { data } = await s.from('certificates').select('*').eq('user_id', userId).order('issued_at', { ascending: false });
    return (data ?? []) as any;
  },

  async getRoadmap(userId) {
    const s = await createClient();
    const { data } = await s.from('roadmap_items').select('*').eq('user_id', userId).order('grade').order('position');
    return (data ?? []) as any;
  },
  async upsertRoadmapItem(item) {
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    await s.from('roadmap_items').upsert({ ...item, user_id: user!.id });
  },
  async deleteRoadmapItem(id) {
    const s = await createClient();
    await s.from('roadmap_items').delete().eq('id', id);
  },

  // ---- Admin: implemented in Phase 6 ----
  async adminUpsertOpportunity() { throw new Error('Phase 6'); },
  async adminDeleteOpportunity() { throw new Error('Phase 6'); },
  async adminUpsertCourse()      { throw new Error('Phase 6'); },
  async adminUpsertLesson()      { throw new Error('Phase 6'); },
  async adminDeleteCourse()      { throw new Error('Phase 6'); },
  async adminStats()             { throw new Error('Phase 6'); },
};
```

---

## 7. Tag taxonomy — `src/lib/data/seed/tags.ts` (complete, trilingual)

```ts
import type { Tag } from '../types';
export const SEED_TAGS: Tag[] = [
  // directions
  { slug: 'stem',          kind: 'direction', sort: 1,  label: { en: 'STEM',           ru: 'STEM',                  kk: 'STEM' } },
  { slug: 'programming',   kind: 'direction', sort: 2,  label: { en: 'Programming',    ru: 'Программирование',      kk: 'Бағдарламалау' } },
  { slug: 'science',       kind: 'direction', sort: 3,  label: { en: 'Science',        ru: 'Наука',                 kk: 'Ғылым' } },
  { slug: 'business',      kind: 'direction', sort: 4,  label: { en: 'Business',       ru: 'Бизнес',                kk: 'Бизнес' } },
  { slug: 'finance',       kind: 'direction', sort: 5,  label: { en: 'Finance',        ru: 'Финансы',               kk: 'Қаржы' } },
  { slug: 'social-impact', kind: 'direction', sort: 6,  label: { en: 'Social Impact',  ru: 'Социальное влияние',    kk: 'Әлеуметтік ықпал' } },
  { slug: 'humanities',    kind: 'direction', sort: 7,  label: { en: 'Humanities',     ru: 'Гуманитарные науки',    kk: 'Гуманитарлық ғылымдар' } },
  { slug: 'arts',          kind: 'direction', sort: 8,  label: { en: 'Arts',           ru: 'Искусство',             kk: 'Өнер' } },
  // subjects
  { slug: 'math',          kind: 'subject',   sort: 10, label: { en: 'Mathematics',    ru: 'Математика',            kk: 'Математика' } },
  { slug: 'physics',       kind: 'subject',   sort: 11, label: { en: 'Physics',        ru: 'Физика',                kk: 'Физика' } },
  { slug: 'biology',       kind: 'subject',   sort: 12, label: { en: 'Biology',        ru: 'Биология',              kk: 'Биология' } },
  { slug: 'chemistry',     kind: 'subject',   sort: 13, label: { en: 'Chemistry',      ru: 'Химия',                 kk: 'Химия' } },
  { slug: 'cs',            kind: 'subject',   sort: 14, label: { en: 'Computer Science',ru: 'Информатика',          kk: 'Информатика' } },
  { slug: 'economics',     kind: 'subject',   sort: 15, label: { en: 'Economics',      ru: 'Экономика',             kk: 'Экономика' } },
  { slug: 'english',       kind: 'subject',   sort: 16, label: { en: 'English',        ru: 'Английский язык',       kk: 'Ағылшын тілі' } },
  { slug: 'sat',           kind: 'subject',   sort: 17, label: { en: 'SAT Prep',       ru: 'Подготовка к SAT',      kk: 'SAT дайындығы' } },
  { slug: 'ielts',         kind: 'subject',   sort: 18, label: { en: 'IELTS Prep',     ru: 'Подготовка к IELTS',    kk: 'IELTS дайындығы' } },
  { slug: 'admissions',    kind: 'subject',   sort: 19, label: { en: 'University Admissions', ru: 'Поступление в вуз', kk: 'Университетке түсу' } },
];
```

---

## 8. Opportunities seed — `src/lib/data/seed/opportunities.ts`

> **Sample data.** Program names are real for realism, but **deadlines and `apply_url`s are placeholders — verify before the live demo** (or leave as-is; the brief permits mock data). Deadlines are 2026 placeholders relative to "today = June 2026."

```ts
import type { OpportunityType, OpportunityFormat, Localized } from '../types';
type Seed = {
  title: Localized; summary: Localized; description: Localized; requirements: Localized;
  type: OpportunityType; format: OpportunityFormat; tags: string[];
  grade_min: number; grade_max: number; deadline: string; location?: string;
  organizer?: string; apply_url?: string; featured?: boolean;
};
export const SEED_OPPORTUNITIES: Seed[] = [
  {
    title: { en: 'International Mathematical Olympiad (IMO)', ru: 'Международная математическая олимпиада (IMO)', kk: 'Халықаралық математикалық олимпиада (IMO)' },
    summary: { en: 'The world championship of high-school mathematics.', ru: 'Чемпионат мира по математике среди школьников.', kk: 'Мектеп математикасы бойынша әлем чемпионаты.' },
    description: { en: 'Six problems over two days; the most prestigious math competition for pre-university students.', ru: 'Шесть задач за два дня — самое престижное математическое соревнование для школьников.', kk: 'Екі күнде алты есеп — мектеп оқушыларына арналған ең беделді математикалық жарыс.' },
    requirements: { en: 'Selection through your national olympiad rounds.', ru: 'Отбор через национальные туры олимпиады.', kk: 'Ұлттық олимпиада турлары арқылы іріктеу.' },
    type: 'olympiad', format: 'offline', tags: ['stem','math'], grade_min: 9, grade_max: 11,
    deadline: '2026-12-01', organizer: 'IMO Foundation', apply_url: 'https://www.imo-official.org/', featured: true,
  },
  {
    title: { en: 'Regeneron ISEF', ru: 'Regeneron ISEF', kk: 'Regeneron ISEF' },
    summary: { en: 'The largest pre-college STEM research competition.', ru: 'Крупнейший STEM-конкурс научных проектов для школьников.', kk: 'Мектеп оқушыларына арналған ең ірі STEM зерттеу байқауы.' },
    description: { en: 'Present an original research project to a global panel; affiliated fairs feed the international final.', ru: 'Представьте оригинальный исследовательский проект международному жюри; отбор идёт через аффилированные конкурсы.', kk: 'Халықаралық қазылар алқасына түпнұсқа зерттеу жобасын ұсыныңыз.' },
    requirements: { en: 'Win a qualifying affiliated science fair.', ru: 'Победа в квалификационном научном конкурсе.', kk: 'Іріктеу ғылыми байқауында жеңіске жету.' },
    type: 'competition', format: 'offline', tags: ['stem','science','biology','chemistry','physics'], grade_min: 9, grade_max: 11,
    deadline: '2026-02-15', organizer: 'Society for Science', apply_url: 'https://www.societyforscience.org/isef/',
  },
  {
    title: { en: 'Yale Young Global Scholars', ru: 'Yale Young Global Scholars', kk: 'Yale Young Global Scholars' },
    summary: { en: 'Two-week interdisciplinary summer program at Yale.', ru: 'Двухнедельная междисциплинарная летняя программа в Йеле.', kk: 'Йельдегі екі апталық пәнаралық жазғы бағдарлама.' },
    description: { en: 'Live and learn on Yale’s campus across sessions in STEM, politics, and the humanities.', ru: 'Обучение в кампусе Йеля по направлениям STEM, политики и гуманитарных наук.', kk: 'Йель кампусында STEM, саясат және гуманитарлық бағыттар бойынша оқу.' },
    requirements: { en: 'Currently in grade 10 or 11; need-based aid available.', ru: 'Сейчас в 10–11 классе; доступна финансовая помощь.', kk: '10–11 сыныпта оқу; қаржылай көмек бар.' },
    type: 'summer_school', format: 'offline', tags: ['stem','humanities','social-impact','admissions'], grade_min: 10, grade_max: 11,
    deadline: '2026-01-10', location: 'New Haven, USA', organizer: 'Yale University', apply_url: 'https://globalscholars.yale.edu/', featured: true,
  },
  {
    title: { en: 'Technovation Girls', ru: 'Technovation Girls', kk: 'Technovation Girls' },
    summary: { en: 'Build a mobile app or AI project that solves a community problem.', ru: 'Создайте приложение или AI-проект, решающий проблему сообщества.', kk: 'Қоғам мәселесін шешетін қосымша немесе AI-жоба жасаңыз.' },
    description: { en: 'A global tech-entrepreneurship program for girls, ending in an international pitch.', ru: 'Глобальная программа технологического предпринимательства для девушек с финальным питчем.', kk: 'Қыздарға арналған жаһандық технологиялық кәсіпкерлік бағдарламасы.' },
    requirements: { en: 'Girls ages 8–18; form a team and find a mentor.', ru: 'Девушки 8–18 лет; команда и наставник.', kk: '8–18 жас аралығындағы қыздар; команда мен тәлімгер.' },
    type: 'competition', format: 'online', tags: ['programming','cs','business','social-impact'], grade_min: 8, grade_max: 11,
    deadline: '2026-03-01', organizer: 'Technovation', apply_url: 'https://www.technovation.org/',
  },
  {
    title: { en: 'Harvard Pre-College Program', ru: 'Harvard Pre-College Program', kk: 'Harvard Pre-College Program' },
    summary: { en: 'Two-week non-credit summer program for high schoolers.', ru: 'Двухнедельная летняя программа для старшеклассников.', kk: 'Жоғары сынып оқушыларына арналған екі апталық жазғы бағдарлама.' },
    description: { en: 'Study one immersive course on Harvard’s campus and experience college life.', ru: 'Один углублённый курс в кампусе Гарварда и опыт студенческой жизни.', kk: 'Гарвард кампусында бір тереңдетілген курс және студенттік өмір тәжірибесі.' },
    requirements: { en: 'Grades 10–11 in the year of the program.', ru: '10–11 класс на момент программы.', kk: 'Бағдарлама кезінде 10–11 сынып.' },
    type: 'summer_school', format: 'offline', tags: ['humanities','admissions','stem'], grade_min: 10, grade_max: 11,
    deadline: '2026-01-20', location: 'Cambridge, USA', organizer: 'Harvard University', apply_url: 'https://summer.harvard.edu/high-school-programs/',
  },
  {
    title: { en: 'nFactorial Incubator', ru: 'nFactorial Incubator', kk: 'nFactorial Incubator' },
    summary: { en: 'Intensive coding summer school in Almaty.', ru: 'Интенсивная летняя школа по программированию в Алматы.', kk: 'Алматыдағы қарқынды бағдарламалау жазғы мектебі.' },
    description: { en: 'Build and ship a real product in weeks alongside Kazakhstan’s top young developers.', ru: 'За несколько недель создайте реальный продукт вместе с лучшими молодыми разработчиками Казахстана.', kk: 'Бірнеше аптада Қазақстанның үздік жас әзірлеушілерімен бірге нақты өнім жасаңыз.' },
    requirements: { en: 'Basic programming; selection challenge.', ru: 'Базовое программирование; отборочное задание.', kk: 'Бағдарламалау негіздері; іріктеу тапсырмасы.' },
    type: 'summer_school', format: 'offline', tags: ['programming','cs','business'], grade_min: 10, grade_max: 11,
    deadline: '2026-05-01', location: 'Almaty, Kazakhstan', organizer: 'nFactorial', apply_url: 'https://www.nfactorial.school/', featured: true,
  },
  {
    title: { en: 'Republican Subject Olympiad', ru: 'Республиканская олимпиада по предметам', kk: 'Республикалық пәндік олимпиада' },
    summary: { en: 'Kazakhstan’s national academic olympiad.', ru: 'Национальная предметная олимпиада Казахстана.', kk: 'Қазақстанның ұлттық пәндік олимпиадасы.' },
    description: { en: 'School → regional → republican rounds across math, physics, biology, and more.', ru: 'Школьный → областной → республиканский этапы по математике, физике, биологии и др.', kk: 'Математика, физика, биология және басқа пәндер бойынша мектеп → облыстық → республикалық кезеңдер.' },
    requirements: { en: 'Enroll through your school.', ru: 'Регистрация через школу.', kk: 'Мектеп арқылы тіркелу.' },
    type: 'olympiad', format: 'hybrid', tags: ['stem','math','physics','biology','chemistry','humanities'], grade_min: 9, grade_max: 11,
    deadline: '2026-11-15', location: 'Kazakhstan', organizer: 'РНПЦ «Дарын»', apply_url: 'https://daryn.kz/',
  },
  {
    title: { en: 'Harvard Model United Nations', ru: 'Harvard Model United Nations', kk: 'Harvard Model United Nations' },
    summary: { en: 'The world’s largest and oldest college-run MUN.', ru: 'Крупнейшая и старейшая студенческая модель ООН.', kk: 'Әлемдегі ең ірі әрі көне студенттік БҰҰ үлгісі.' },
    description: { en: 'Debate global issues, draft resolutions, and practice diplomacy with delegates worldwide.', ru: 'Обсуждайте мировые проблемы, готовьте резолюции и практикуйте дипломатию с делегатами со всего мира.', kk: 'Жаһандық мәселелерді талқылап, қарарлар дайындап, дипломатияны жаттықтырыңыз.' },
    requirements: { en: 'Register as a delegation or individually.', ru: 'Регистрация делегацией или индивидуально.', kk: 'Делегация ретінде немесе жеке тіркелу.' },
    type: 'conference', format: 'offline', tags: ['social-impact','humanities','business'], grade_min: 9, grade_max: 11,
    deadline: '2026-10-01', organizer: 'Harvard University', apply_url: 'https://www.harvardmun.org/',
  },
  {
    title: { en: 'Pioneer Research Program', ru: 'Pioneer Research Program', kk: 'Pioneer Research Program' },
    summary: { en: 'Online research with a university professor.', ru: 'Онлайн-исследование под руководством профессора.', kk: 'Университет профессорымен онлайн зерттеу.' },
    description: { en: 'A selective online cohort producing an independent research paper across many disciplines.', ru: 'Селективная онлайн-программа с написанием самостоятельной научной работы по разным дисциплинам.', kk: 'Әртүрлі пәндер бойынша дербес ғылыми жұмыс жазатын іріктемелі онлайн бағдарлама.' },
    requirements: { en: 'Strong academics; application + transcript.', ru: 'Высокая успеваемость; заявка и транскрипт.', kk: 'Жоғары үлгерім; өтінім мен транскрипт.' },
    type: 'research', format: 'online', tags: ['stem','humanities','science','economics','social-impact'], grade_min: 10, grade_max: 11,
    deadline: '2026-04-01', organizer: 'Pioneer Academics', apply_url: 'https://pioneeracademics.com/',
  },
  {
    title: { en: 'Mentoria Global STEM Scholarship', ru: 'Стипендия Mentoria Global STEM', kk: 'Mentoria Global STEM шәкіртақысы' },
    summary: { en: 'Mentoria’s own scholarship for promising STEM students.', ru: 'Собственная стипендия Mentoria для перспективных STEM-учеников.', kk: 'Перспективалы STEM оқушыларына арналған Mentoria шәкіртақысы.' },
    description: { en: 'Covers course fees and mentorship for students showing exceptional drive in STEM.', ru: 'Покрывает оплату курсов и наставничество для самых целеустремлённых STEM-учеников.', kk: 'STEM-те ерекше ұмтылыс танытқан оқушыларға курс ақысы мен тәлімгерлікті қамтиды.' },
    requirements: { en: 'Essay + teacher recommendation; need-based.', ru: 'Эссе и рекомендация учителя; по уровню нуждаемости.', kk: 'Эссе және мұғалім ұсынысы; қажеттілікке негізделген.' },
    type: 'scholarship', format: 'online', tags: ['stem','finance','programming','science'], grade_min: 8, grade_max: 11,
    deadline: '2026-09-01', organizer: 'Mentoria', apply_url: 'https://example.com/mentoria-scholarship', featured: true,
  },
];
```

---

## 9. Courses seed — `src/lib/data/seed/courses.ts`

> EN + RU bodies/quizzes are complete and demo-ready. **KK fields are drafts for titles**; lesson bodies/quiz text in KK are filled by the translation pass (Build Prompt 1-7). Video URLs are YouTube-embed placeholders — swap for real Mentoria videos when available.

```ts
import type { Localized } from '../types';
const L = (en: string, ru: string, kk: string): Localized => ({ en, ru, kk });
const VIDEO = 'https://www.youtube.com/embed/ysz5S6PUM-U'; // placeholder embed

type QSeed = { id: string; prompt: Localized; options: { id: string; label: Localized }[]; correct: string };
type LessonSeed = { title: Localized; content_type: 'text' | 'video'; video_url?: string; body: Localized;
  materials?: { label: Localized; url: string }[]; duration_min?: number;
  quiz?: { title?: Localized; passing_score?: number; questions: QSeed[] } };
type CourseSeed = { slug: string; title: Localized; summary: Localized; description: Localized;
  subject: string; difficulty: 'beginner' | 'intermediate' | 'advanced'; tags: string[];
  estimated_hours: number; lessons: LessonSeed[] };

export const SEED_COURSES: CourseSeed[] = [
  // ─────────────────────────── 1) SAT EBRW ───────────────────────────
  {
    slug: 'sat-ebrw', subject: 'sat', difficulty: 'intermediate',
    tags: ['english','sat','admissions','humanities'], estimated_hours: 8,
    title: L('SAT EBRW: Evidence-Based Reading & Writing', 'SAT EBRW: чтение и письмо', 'SAT EBRW: оқу және жазу'),
    summary: L('Master the reading and writing half of the SAT.', 'Освойте чтение и письмо в SAT.', 'SAT-тің оқу және жазу бөлігін меңгеріңіз.'),
    description: L('Strategies for reading comprehension, evidence, vocabulary in context, and grammar — with timed practice.',
      'Стратегии понимания текста, работы с доказательствами, лексики в контексте и грамматики с практикой на время.',
      'Мәтінді түсіну, дәлел, контекстегі лексика және грамматика стратегиялары — уақытқа жаттығумен.'),
    lessons: [
      { title: L('Overview & Scoring', 'Обзор и система баллов', 'Шолу және балл жүйесі'), content_type: 'video', video_url: VIDEO, duration_min: 15,
        body: L('How EBRW is structured, how it is scored, and how to plan your prep.',
          'Как устроен раздел EBRW, как он оценивается и как планировать подготовку.',
          'EBRW бөлімі қалай құрылған, қалай бағаланады және дайындықты қалай жоспарлау керек.'),
        materials: [{ label: L('Score chart (PDF)', 'Таблица баллов (PDF)', 'Балл кестесі (PDF)'), url: 'https://example.com/sat-scores.pdf' }],
        quiz: { passing_score: 70, questions: [
          { id: 'q1', prompt: L('What is the max EBRW score?', 'Максимальный балл EBRW?', 'EBRW максималды балы қандай?'),
            options: [{ id: 'a', label: L('800', '800', '800') }, { id: 'b', label: L('1600', '1600', '1600') }, { id: 'c', label: L('400', '400', '400') }], correct: 'a' },
          { id: 'q2', prompt: L('EBRW combines which two sections?', 'EBRW объединяет какие два раздела?', 'EBRW қай екі бөлімді біріктіреді?'),
            options: [{ id: 'a', label: L('Math & Reading', 'Математику и чтение', 'Математика мен оқу') }, { id: 'b', label: L('Reading & Writing', 'Чтение и письмо', 'Оқу мен жазу') }, { id: 'c', label: L('Essay & Math', 'Эссе и математику', 'Эссе мен математика') }], correct: 'b' },
        ] } },
      { title: L('Command of Evidence', 'Работа с доказательствами', 'Дәлелмен жұмыс'), content_type: 'text', duration_min: 20,
        body: L('Find lines in the passage that justify your answer; link claim and evidence.',
          'Находите строки в тексте, подтверждающие ваш ответ; связывайте утверждение и доказательство.',
          'Жауабыңызды растайтын жолдарды табыңыз; тұжырым мен дәлелді байланыстырыңыз.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('A “command of evidence” question asks you to…', 'Вопрос «command of evidence» просит…', '«Command of evidence» сұрағы нені сұрайды?'),
            options: [{ id: 'a', label: L('Guess the author’s mood', 'Угадать настроение автора', 'Автордың көңіл-күйін болжау') }, { id: 'b', label: L('Cite the line that supports an answer', 'Указать строку, подтверждающую ответ', 'Жауапты растайтын жолды көрсету') }], correct: 'b' },
          { id: 'q2', prompt: L('Best first step on a paired question?', 'Лучший первый шаг в парном вопросе?', 'Жұптық сұрақта ең дұрыс бірінші қадам?'),
            options: [{ id: 'a', label: L('Answer the first, then test evidence options', 'Ответить на первый, затем проверить варианты доказательств', 'Алдымен біріншісіне жауап беріп, дәлелдерді тексеру') }, { id: 'b', label: L('Skip both', 'Пропустить оба', 'Екеуін де өткізіп жіберу') }], correct: 'a' },
        ] } },
      { title: L('Words in Context', 'Лексика в контексте', 'Контекстегі лексика'), content_type: 'text', duration_min: 18,
        body: L('Choose word meanings based on the sentence, not the most common definition.',
          'Выбирайте значение слова по предложению, а не по самому частому определению.',
          'Сөздің мағынасын ең жиі анықтамаға емес, сөйлемге қарай таңдаңыз.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('Words-in-context answers depend on…', 'Ответы зависят от…', 'Жауаптар неге байланысты?'),
            options: [{ id: 'a', label: L('The surrounding sentence', 'Окружающего предложения', 'Қоршаған сөйлемге') }, { id: 'b', label: L('The dictionary’s first meaning', 'Первого значения в словаре', 'Сөздіктегі бірінші мағынаға') }], correct: 'a' },
          { id: 'q2', prompt: L('Good tactic before reading options?', 'Хорошая тактика до просмотра вариантов?', 'Нұсқаларды көрмес бұрын жақсы тәсіл?'),
            options: [{ id: 'a', label: L('Predict your own word', 'Предположить своё слово', 'Өз сөзіңізді болжау') }, { id: 'b', label: L('Pick the longest option', 'Выбрать самый длинный вариант', 'Ең ұзын нұсқаны таңдау') }], correct: 'a' },
        ] } },
      { title: L('Grammar Essentials', 'Основы грамматики', 'Грамматика негіздері'), content_type: 'text', duration_min: 22,
        body: L('Subject–verb agreement, punctuation, and concision — the highest-yield Writing rules.',
          'Согласование, пунктуация и лаконичность — самые ценные правила раздела Writing.',
          'Келісім, тыныс белгілері және ықшамдылық — Writing бөлімінің ең құнды ережелері.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('“The team ___ winning.” Correct verb?', '«The team ___ winning.» Верный глагол?', '«The team ___ winning.» Дұрыс етістік?'),
            options: [{ id: 'a', label: L('is', 'is', 'is') }, { id: 'b', label: L('are', 'are', 'are') }], correct: 'a' },
          { id: 'q2', prompt: L('SAT Writing usually prefers…', 'SAT Writing обычно предпочитает…', 'SAT Writing әдетте нені таңдайды?'),
            options: [{ id: 'a', label: L('The most concise correct option', 'Самый краткий верный вариант', 'Ең ықшам әрі дұрыс нұсқаны') }, { id: 'b', label: L('The wordiest option', 'Самый многословный вариант', 'Ең көпсөзді нұсқаны') }], correct: 'a' },
        ] } },
    ],
  },

  // ─────────────────────────── 2) IELTS ───────────────────────────
  {
    slug: 'ielts', subject: 'ielts', difficulty: 'intermediate',
    tags: ['english','ielts','admissions'], estimated_hours: 10,
    title: L('IELTS Academic: Band 7+', 'IELTS Academic: на 7+', 'IELTS Academic: 7+ балл'),
    summary: L('A focused path to a strong IELTS band.', 'Чёткий путь к высокому баллу IELTS.', 'IELTS-те жоғары балға нақты жол.'),
    description: L('Listening, reading, writing, and speaking strategies with band-descriptor breakdowns.',
      'Стратегии аудирования, чтения, письма и говорения с разбором критериев оценивания.',
      'Тыңдалым, оқылым, жазылым және сөйлеу стратегиялары — бағалау критерийлерін талдаумен.'),
    lessons: [
      { title: L('Format & Band Scores', 'Формат и баллы', 'Формат және балдар'), content_type: 'video', video_url: VIDEO, duration_min: 14,
        body: L('The four sections, timing, and what each band level means.', 'Четыре раздела, тайминг и значение каждого балла.', 'Төрт бөлім, уақыт және әр баллдың мәні.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('How many IELTS sections?', 'Сколько разделов в IELTS?', 'IELTS-те неше бөлім бар?'),
            options: [{ id: 'a', label: L('3', '3', '3') }, { id: 'b', label: L('4', '4', '4') }], correct: 'b' },
          { id: 'q2', prompt: L('Top band score is…', 'Максимальный балл…', 'Ең жоғары балл…'),
            options: [{ id: 'a', label: L('9.0', '9.0', '9.0') }, { id: 'b', label: L('10.0', '10.0', '10.0') }], correct: 'a' },
        ] } },
      { title: L('Listening Strategies', 'Стратегии аудирования', 'Тыңдалым стратегиялары'), content_type: 'text', duration_min: 20,
        body: L('Predict answers, follow signpost words, and watch spelling in your responses.', 'Предугадывайте ответы, следите за словами-маркерами и орфографией.', 'Жауаптарды болжаңыз, бағыттаушы сөздерді бақылаңыз, емлеге назар аударыңыз.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('Misspelled answers are…', 'Ответы с ошибкой…', 'Қате жазылған жауаптар…'),
            options: [{ id: 'a', label: L('Still correct', 'Всё равно верны', 'Бәрібір дұрыс') }, { id: 'b', label: L('Marked wrong', 'Считаются неверными', 'Қате деп есептеледі') }], correct: 'b' },
          { id: 'q2', prompt: L('“Signpost” words help you…', 'Слова-маркеры помогают…', 'Бағыттаушы сөздер неге көмектеседі?'),
            options: [{ id: 'a', label: L('Anticipate the next answer', 'Предугадать следующий ответ', 'Келесі жауапты болжауға') }, { id: 'b', label: L('Translate the audio', 'Перевести аудио', 'Аудионы аудару') }], correct: 'a' },
        ] } },
      { title: L('Reading: Skimming & Scanning', 'Чтение: беглый и поисковый', 'Оқу: жылдам әрі іздеп оқу'), content_type: 'text', duration_min: 20,
        body: L('Skim for gist, scan for keywords; do not read every word under time pressure.', 'Бегло — для сути, поисково — по ключевым словам; не читайте каждое слово.', 'Мәнін түсіну үшін жылдам, кілт сөздер үшін іздеп оқыңыз.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('Skimming is for…', 'Беглое чтение — для…', 'Жылдам оқу — не үшін?'),
            options: [{ id: 'a', label: L('Overall gist', 'Общей сути', 'Жалпы мәні') }, { id: 'b', label: L('Exact dates', 'Точных дат', 'Нақты күндер') }], correct: 'a' },
          { id: 'q2', prompt: L('Scanning is for…', 'Поисковое чтение — для…', 'Іздеп оқу — не үшін?'),
            options: [{ id: 'a', label: L('Specific keywords', 'Конкретных ключевых слов', 'Нақты кілт сөздер') }, { id: 'b', label: L('The author’s tone', 'Тона автора', 'Автор үні') }], correct: 'a' },
        ] } },
      { title: L('Writing Task 2: Essay Structure', 'Writing Task 2: структура эссе', 'Writing Task 2: эссе құрылымы'), content_type: 'text', duration_min: 24,
        body: L('Intro with a clear position, two body paragraphs with examples, concise conclusion.', 'Введение с чёткой позицией, два абзаца с примерами, краткий вывод.', 'Нақты ұстаным бар кіріспе, мысалы бар екі абзац, қысқа қорытынды.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('A Band 7 essay needs a clear…', 'Эссе на 7 требует чёткой…', '7 балдық эссеге не қажет?'),
            options: [{ id: 'a', label: L('Position & structure', 'Позиции и структуры', 'Ұстаным мен құрылым') }, { id: 'b', label: L('Rare vocabulary only', 'Только редкой лексики', 'Тек сирек лексика') }], correct: 'a' },
          { id: 'q2', prompt: L('Task 2 minimum word count?', 'Минимум слов в Task 2?', 'Task 2 минималды сөз саны?'),
            options: [{ id: 'a', label: L('150', '150', '150') }, { id: 'b', label: L('250', '250', '250') }], correct: 'b' },
        ] } },
    ],
  },

  // ─────────────────────────── 3) UNIVERSITY ADMISSIONS ───────────────────────────
  {
    slug: 'university-admissions', subject: 'admissions', difficulty: 'beginner',
    tags: ['admissions','humanities','social-impact'], estimated_hours: 6,
    title: L('University Admissions 101', 'Поступление в университет 101', 'Университетке түсу 101'),
    summary: L('Plan and present a competitive application.', 'Спланируйте и подайте конкурентную заявку.', 'Бәсекеге қабілетті өтінім жоспарлаңыз және ұсыныңыз.'),
    description: L('From building a profile to essays, recommendations, deadlines, and financial aid — for US/UK/EU/Asia.',
      'От построения профиля до эссе, рекомендаций, дедлайнов и финансовой помощи — для США/Великобритании/ЕС/Азии.',
      'Профиль құрудан эссе, ұсыныс, мерзім және қаржылай көмекке дейін — АҚШ/Ұлыбритания/ЕО/Азия.'),
    lessons: [
      { title: L('The Admissions Landscape', 'Карта поступления', 'Түсу картасы'), content_type: 'video', video_url: VIDEO, duration_min: 16,
        body: L('How systems differ across the US, UK, EU, and Asia, and how to choose targets.', 'Чем отличаются системы США, Великобритании, ЕС и Азии и как выбирать вузы.', 'АҚШ, Ұлыбритания, ЕО және Азия жүйелерінің айырмашылығы және мақсат таңдау.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('UK applications usually go through…', 'Заявки в Великобританию обычно через…', 'Ұлыбританияға өтінім әдетте қайдан өтеді?'),
            options: [{ id: 'a', label: L('UCAS', 'UCAS', 'UCAS') }, { id: 'b', label: L('The Common App', 'The Common App', 'The Common App') }], correct: 'a' },
          { id: 'q2', prompt: L('A balanced list mixes…', 'Сбалансированный список включает…', 'Теңгерімді тізімде не болады?'),
            options: [{ id: 'a', label: L('Reach, match, safety schools', 'Амбициозные, подходящие, запасные', 'Талапты, сәйкес, сақтық') }, { id: 'b', label: L('Only reach schools', 'Только амбициозные', 'Тек талапты') }], correct: 'a' },
        ] } },
      { title: L('Building a Profile', 'Построение профиля', 'Профиль құру'), content_type: 'text', duration_min: 18,
        body: L('Depth beats breadth: a few committed activities with real impact outshine a long shallow list.', 'Глубина важнее широты: несколько серьёзных активностей с реальным влиянием лучше длинного поверхностного списка.', 'Тереңдік ауқымнан маңызды: нақты ықпалы бар бірнеше белсенділік ұзын тізімнен жақсы.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('Admissions value activities that show…', 'Ценятся активности, показывающие…', 'Қандай белсенділік бағаланады?'),
            options: [{ id: 'a', label: L('Commitment & impact', 'Вовлечённость и влияние', 'Адалдық пен ықпал') }, { id: 'b', label: L('The longest list', 'Самый длинный список', 'Ең ұзын тізім') }], correct: 'a' },
          { id: 'q2', prompt: L('“Depth over breadth” means…', '«Глубина важнее широты» —', '«Тереңдік ауқымнан маңызды» —'),
            options: [{ id: 'a', label: L('Focus on a few areas deeply', 'Глубоко в нескольких сферах', 'Бірнеше салаға терең үңілу') }, { id: 'b', label: L('Try everything once', 'Попробовать всё по разу', 'Бәрін бір рет көру') }], correct: 'a' },
        ] } },
      { title: L('The Personal Essay', 'Личное эссе', 'Жеке эссе'), content_type: 'text', duration_min: 22,
        body: L('Tell one specific story in your own voice; show growth rather than listing achievements.', 'Расскажите одну конкретную историю своим голосом; покажите рост, а не список достижений.', 'Өз даусыңызбен бір нақты оқиға айтыңыз; жетістік тізбесінің орнына өсуді көрсетіңіз.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('A strong essay focuses on…', 'Сильное эссе сосредоточено на…', 'Күшті эссе неге бағытталады?'),
            options: [{ id: 'a', label: L('One specific, personal story', 'Одной конкретной личной истории', 'Бір нақты жеке оқиғаға') }, { id: 'b', label: L('A résumé in prose', 'Резюме в виде текста', 'Мәтін түріндегі түйіндеме') }], correct: 'a' },
          { id: 'q2', prompt: L('Best essays demonstrate…', 'Лучшие эссе показывают…', 'Үздік эссе нені көрсетеді?'),
            options: [{ id: 'a', label: L('Reflection and growth', 'Рефлексию и рост', 'Рефлексия мен өсу') }, { id: 'b', label: L('Big words', 'Сложные слова', 'Күрделі сөздер') }], correct: 'a' },
        ] } },
    ],
  },
];
```

---

## 10. Seed runner — `scripts/seed.ts`

> Uses the **secret** key to bypass RLS for seeding. Idempotent: it clears the catalog tables (not user data) and re-inserts. Run locally only.

```ts
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { SEED_TAGS } from '../src/lib/data/seed/tags';
import { SEED_OPPORTUNITIES } from '../src/lib/data/seed/opportunities';
import { SEED_COURSES } from '../src/lib/data/seed/courses';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,            // server-only secret/service key
  { auth: { persistSession: false } },
);

async function main() {
  // Clear catalog (cascades to lessons, quizzes, saved/enrollments referencing them).
  await supabase.from('quizzes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('lessons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('opportunities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('tags').delete().neq('slug', '');

  // Tags
  await supabase.from('tags').insert(SEED_TAGS);
  console.log(`✓ ${SEED_TAGS.length} tags`);

  // Opportunities
  const { error: oErr } = await supabase.from('opportunities').insert(SEED_OPPORTUNITIES as any);
  if (oErr) throw oErr;
  console.log(`✓ ${SEED_OPPORTUNITIES.length} opportunities`);

  // Courses → lessons → quizzes
  for (const c of SEED_COURSES) {
    const { data: course, error: cErr } = await supabase.from('courses')
      .insert({ slug: c.slug, title: c.title, summary: c.summary, description: c.description,
        subject: c.subject, difficulty: c.difficulty, tags: c.tags, estimated_hours: c.estimated_hours })
      .select().single();
    if (cErr) throw cErr;
    for (let i = 0; i < c.lessons.length; i++) {
      const ls = c.lessons[i];
      const { data: lesson, error: lErr } = await supabase.from('lessons')
        .insert({ course_id: course.id, position: i + 1, title: ls.title, content_type: ls.content_type,
          video_url: ls.video_url ?? null, body: ls.body, materials: ls.materials ?? [], duration_min: ls.duration_min ?? null })
        .select().single();
      if (lErr) throw lErr;
      if (ls.quiz) {
        const { error: qErr } = await supabase.from('quizzes').insert({
          lesson_id: lesson.id, title: ls.quiz.title ?? null,
          passing_score: ls.quiz.passing_score ?? 70, questions: ls.quiz.questions });
        if (qErr) throw qErr;
      }
    }
    console.log(`✓ course ${c.slug} (${c.lessons.length} lessons)`);
  }
  console.log('Seed complete.');
}
main().catch((e) => { console.error(e); process.exit(1); });
```

**Run it:**
```bash
npm i -D tsx dotenv
npx tsx scripts/seed.ts
```

---

## 11. Build prompts (ordered)

**BP1-1 — Migrate schema.** "Run Section 2 SQL in the Supabase SQL editor. Acceptance: all tables/enums/indexes exist; no errors."

**BP1-2 — Migrate RLS + RPCs.** "Run Section 3 SQL. Acceptance: RLS is on for all tables; `recommend_opportunities`, `recommend_courses`, `grade_quiz`, `issue_certificate` exist."

**BP1-3 — Types.** "Add `src/lib/data/types.ts` (Section 4). Acceptance: `tsc --noEmit` passes."

**BP1-4 — Provider contract + Supabase impl.** "Replace `src/lib/data/provider.ts` with Section 5 and add `src/lib/data/supabase-provider.ts` (Section 6). Acceptance: imports resolve; `tsc --noEmit` passes; admin methods throw 'Phase 6'."

**BP1-5 — Seed data files.** "Add `src/lib/data/seed/{tags,opportunities,courses}.ts` (Sections 7–9). Acceptance: files type-check."

**BP1-6 — Seed the database.** "Add `scripts/seed.ts` (Section 10), install `tsx`+`dotenv`, run it. Acceptance: 17 tags, 10 opportunities, 3 courses with lessons + quizzes appear in Supabase tables."

**BP1-7 — Translation completion pass.** "For every KK field in the seed and any KK UI strings still in English, generate Kazakh translations (LLM-assisted is fine) and have a native speaker review before the demo. Also review the RU strings. Acceptance: no English text leaks when the app is set to KK or RU."

**BP1-8 — Smoke test.** "In a temporary Server Component or a throwaway script, call `db.listOpportunities({})`, `db.getCourseBySlug('sat-ebrw')`, and `db.recommendOpportunities(['stem','math'], 10)`; log counts. Acceptance: opportunities list returns 10, the SAT course returns 4 lessons, recommendations return STEM/math-tagged items first."

---

## 12. Definition of Done for Phase 1

- All tables, enums, indexes, RLS policies, and the four RPCs exist in Supabase.
- `types.ts`, `provider.ts`, and `supabase-provider.ts` compile; catalog reads, recommendations, and student-state methods are implemented; admin methods throw a clear Phase-6 marker.
- The database holds 17 tags, 10 published opportunities, and 3 published courses (`sat-ebrw`, `ielts`, `university-admissions`) with their lessons and quizzes.
- A signed-out (anon) request can read published opportunities/courses; a signed-in non-owner cannot read another user's saves/progress; quiz `correct` answers are never returned to the client.
- Recommendation RPCs rank by tag overlap.
- KK/RU content reviewed (or flagged for review before demo).

---

## 13. What Phase 2 will cover (preview)

**Phase 2 — Discovery engine (the first visible feature):** the opportunities catalog page wired to `db.listOpportunities` with the filter rail (type, format, direction/subject tags, grade, deadline) and keyword search, the opportunity card and detail page, the save/favorite interaction (optimistic, backed by `db.saveOpportunity`), and the visitor-vs-student gating (teaser browse for anon, save/apply requires sign-in). All in the monochrome system, fully responsive, with skeletons and empty states. This is the first end-to-end slice of the demo spine.
