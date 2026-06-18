-- Mentoria Hub — Phase 1 RLS + RPCs (Migration 2 of 2). Run after 0002.
-- Idempotent: safe to re-run.

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
drop policy if exists "tags read"        on public.tags;
drop policy if exists "tags admin write" on public.tags;
create policy "tags read"        on public.tags for select using (true);
create policy "tags admin write" on public.tags for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "opps read"        on public.opportunities;
drop policy if exists "opps admin write" on public.opportunities;
create policy "opps read"        on public.opportunities for select using (is_published or public.is_admin());
create policy "opps admin write" on public.opportunities for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "courses read"        on public.courses;
drop policy if exists "courses admin write" on public.courses;
create policy "courses read"        on public.courses for select using (is_published or public.is_admin());
create policy "courses admin write" on public.courses for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "lessons read"        on public.lessons;
drop policy if exists "lessons admin write" on public.lessons;
create policy "lessons read" on public.lessons for select using (
  public.is_admin() or exists (select 1 from public.courses c where c.id = lessons.course_id and c.is_published));
create policy "lessons admin write" on public.lessons for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "quizzes read"        on public.quizzes;
drop policy if exists "quizzes admin write" on public.quizzes;
create policy "quizzes read" on public.quizzes for select using (
  public.is_admin() or exists (
    select 1 from public.lessons l join public.courses c on c.id = l.course_id
    where l.id = quizzes.lesson_id and c.is_published));
create policy "quizzes admin write" on public.quizzes for all using (public.is_admin()) with check (public.is_admin());

-- ============ PER-USER ROWS: owner full access + admin read-all ============
drop policy if exists "own enrollments"   on public.enrollments;
drop policy if exists "admin read enroll" on public.enrollments;
create policy "own enrollments"   on public.enrollments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin read enroll" on public.enrollments for select using (public.is_admin());

drop policy if exists "own progress"    on public.lesson_progress;
drop policy if exists "admin read prog" on public.lesson_progress;
create policy "own progress"      on public.lesson_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin read prog"   on public.lesson_progress for select using (public.is_admin());

drop policy if exists "own attempts"   on public.quiz_attempts;
drop policy if exists "admin read att" on public.quiz_attempts;
create policy "own attempts"      on public.quiz_attempts for select using (auth.uid() = user_id);
create policy "admin read att"    on public.quiz_attempts for select using (public.is_admin());

drop policy if exists "own saved"        on public.saved_opportunities;
drop policy if exists "admin read saved" on public.saved_opportunities;
create policy "own saved"         on public.saved_opportunities for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin read saved"  on public.saved_opportunities for select using (public.is_admin());

drop policy if exists "own certs"       on public.certificates;
drop policy if exists "admin read certs" on public.certificates;
create policy "own certs"         on public.certificates for select using (auth.uid() = user_id);
create policy "admin read certs"  on public.certificates for select using (public.is_admin());

drop policy if exists "own roadmap"       on public.roadmap_items;
drop policy if exists "admin read roadmap" on public.roadmap_items;
create policy "own roadmap"        on public.roadmap_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
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
