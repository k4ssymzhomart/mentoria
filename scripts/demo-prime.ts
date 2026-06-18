// Prime real demo accounts after they have signed in once and profile rows exist.
// Uses the Supabase secret key locally/CI only; never import this from app code.
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const freshId = process.env.DEMO_FRESH_STUDENT_ID;
const primedId = process.env.DEMO_PRIMED_STUDENT_ID;
const adminId = process.env.DEMO_ADMIN_ID;

const L = (en: string, ru: string, kk: string) => ({ en, ru, kk });

async function requireProfile(id: string | undefined, label: string) {
  if (!id) {
    console.log(`- ${label}: skipped (env id not set)`);
    return false;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    console.log(`- ${label}: skipped (${id} has not signed in yet)`);
    return false;
  }

  return true;
}

async function clearStudentState(userId: string) {
  await must(supabase.from('roadmap_items').delete().eq('user_id', userId));
  await must(supabase.from('quiz_attempts').delete().eq('user_id', userId));
  await must(supabase.from('lesson_progress').delete().eq('user_id', userId));
  await must(supabase.from('certificates').delete().eq('user_id', userId));
  await must(supabase.from('enrollments').delete().eq('user_id', userId));
  await must(supabase.from('saved_opportunities').delete().eq('user_id', userId));
}

async function primeFreshStudent(userId: string) {
  await clearStudentState(userId);
  await must(
    supabase
      .from('profiles')
      .update({
        grade: null,
        interests: [],
        subjects: [],
        goals: [],
        locale: 'ru',
        onboarded: false,
        role: 'student',
      })
      .eq('id', userId),
  );
  console.log('ok fresh student reset for live onboarding');
}

async function primePrimedStudent(userId: string) {
  await clearStudentState(userId);
  await must(
    supabase
      .from('profiles')
      .update({
        grade: 10,
        interests: ['stem', 'business', 'programming'],
        subjects: ['math', 'english'],
        goals: ['olympiads', 'portfolio', 'university'],
        locale: 'ru',
        onboarded: true,
        role: 'student',
      })
      .eq('id', userId),
  );

  const savedOpportunity = await firstOpportunity(['programming', 'business']);
  if (savedOpportunity) {
    await must(
      supabase.from('saved_opportunities').upsert(
        {
          user_id: userId,
          opportunity_id: savedOpportunity.id,
          status: 'saved',
        },
        { onConflict: 'user_id,opportunity_id' },
      ),
    );
  }

  const progressCourse = await courseBySlug('sat-ebrw');
  if (progressCourse) {
    await must(
      supabase.from('enrollments').upsert(
        {
          user_id: userId,
          course_id: progressCourse.id,
          completed_at: null,
        },
        { onConflict: 'user_id,course_id' },
      ),
    );
    const lessons = await lessonsForCourse(progressCourse.id);
    const completed = lessons.slice(0, Math.max(1, Math.ceil(lessons.length / 2)));
    if (completed.length) {
      await must(
        supabase.from('lesson_progress').upsert(
          completed.map((lesson) => ({
            user_id: userId,
            course_id: progressCourse.id,
            lesson_id: lesson.id,
          })),
          { onConflict: 'user_id,lesson_id' },
        ),
      );
    }
  }

  const certificateCourse = await courseBySlug('university-admissions');
  if (certificateCourse) {
    const lessons = await lessonsForCourse(certificateCourse.id);
    await must(
      supabase.from('enrollments').upsert(
        {
          user_id: userId,
          course_id: certificateCourse.id,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,course_id' },
      ),
    );
    if (lessons.length) {
      await must(
        supabase.from('lesson_progress').upsert(
          lessons.map((lesson) => ({
            user_id: userId,
            course_id: certificateCourse.id,
            lesson_id: lesson.id,
          })),
          { onConflict: 'user_id,lesson_id' },
        ),
      );
    }
    await must(
      supabase.from('certificates').upsert(
        {
          user_id: userId,
          course_id: certificateCourse.id,
          serial: `DEMO-${userId.slice(0, 8).toUpperCase()}-UA`,
        },
        { onConflict: 'user_id,course_id' },
      ),
    );
  }

  await must(
    supabase.from('roadmap_items').insert([
      {
        user_id: userId,
        grade: 10,
        position: 1,
        kind: 'course',
        ref_id: progressCourse?.id ?? null,
        title: L('Finish SAT EBRW foundations', 'Закончить основы SAT EBRW', 'SAT EBRW негіздерін аяқтау'),
        status: 'in_progress',
      },
      {
        user_id: userId,
        grade: 10,
        position: 2,
        kind: 'opportunity',
        ref_id: savedOpportunity?.id ?? null,
        title: L('Prepare a first tech portfolio submission', 'Подготовить первую заявку с тех-портфолио', 'Тех-портфолиомен алғашқы өтінімді дайындау'),
        status: 'todo',
      },
    ]),
  );

  console.log('ok primed student dashboard, progress, certificate, and roadmap ready');
}

async function primeAdmin(userId: string) {
  await must(
    supabase
      .from('profiles')
      .update({ role: 'admin', onboarded: true, locale: 'ru' })
      .eq('id', userId),
  );
  console.log('ok admin role confirmed');
}

async function primeDraftOlympiad(createdBy: string | null) {
  const title = L(
    'Mentoria Demo STEM Olympiad',
    'Демо-олимпиада Mentoria STEM',
    'Mentoria STEM демо-олимпиадасы',
  );
  const payload = {
    title,
    summary: L(
      'A ready-to-publish draft for the demo admin flow.',
      'Готовый черновик для демо-публикации из админки.',
      'Әкімші демосында жариялауға дайын черновик.',
    ),
    description: L(
      'Publish this draft during the demo, then return to the student view to see it appear in STEM recommendations.',
      'Опубликуйте этот черновик во время демо, затем вернитесь к виду студента и покажите его в STEM-рекомендациях.',
      'Демо кезінде осы черновикті жариялап, студент көрінісіне оралып, оның STEM ұсыныстарында шыққанын көрсетіңіз.',
    ),
    requirements: L(
      'Grades 9-11, interest in math, science, or programming.',
      '9-11 классы, интерес к математике, науке или программированию.',
      '9-11 сынып, математикаға, ғылымға немесе бағдарламалауға қызығушылық.',
    ),
    type: 'olympiad',
    format: 'online',
    tags: ['stem', 'math', 'science', 'programming'],
    grade_min: 9,
    grade_max: 11,
    deadline: '2026-10-15',
    location: 'Online',
    organizer: 'Mentoria',
    apply_url: 'https://example.com/mentoria-demo-olympiad',
    image_url: null,
    featured: true,
    is_published: false,
    created_by: createdBy,
  };

  const { data: existing, error } = await supabase
    .from('opportunities')
    .select('id,title')
    .eq('organizer', 'Mentoria');
  if (error) throw error;

  const match = existing?.find(
    (item) => (item.title as { en?: string } | null)?.en === title.en,
  );

  if (match) {
    await must(supabase.from('opportunities').update(payload).eq('id', match.id));
  } else {
    await must(supabase.from('opportunities').insert(payload));
  }
  console.log('ok unpublished demo olympiad draft ready');
}

async function firstOpportunity(tags: string[]) {
  const { data, error } = await supabase
    .from('opportunities')
    .select('id')
    .eq('is_published', true)
    .overlaps('tags', tags)
    .order('deadline', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function courseBySlug(slug: string) {
  const { data, error } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function lessonsForCourse(courseId: string) {
  const { data, error } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)
    .order('position', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function must<T extends { error: unknown }>(result: T | PromiseLike<T>) {
  const { error } = await result;
  if (error) throw error;
}

async function main() {
  const freshReady = await requireProfile(freshId, 'fresh student');
  if (freshId && freshReady) {
    await primeFreshStudent(freshId);
  }

  const primedReady = await requireProfile(primedId, 'primed student');
  if (primedId && primedReady) {
    await primePrimedStudent(primedId);
  }

  const hasAdmin = await requireProfile(adminId, 'admin');
  if (adminId && hasAdmin) {
    await primeAdmin(adminId);
    await primeDraftOlympiad(adminId);
  } else {
    console.log('- demo draft olympiad: skipped (admin env id/profile required)');
  }
  console.log('Demo prime complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
