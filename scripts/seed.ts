// Seeds the catalog using the SECRET key (bypasses RLS). Idempotent: clears the
// catalog tables (not auth/profiles) and re-inserts. Run locally only.
//   npx tsx scripts/seed.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { SEED_TAGS } from '../src/lib/data/seed/tags';
import { SEED_OPPORTUNITIES } from '../src/lib/data/seed/opportunities';
import { SEED_COURSES } from '../src/lib/data/seed/courses';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const ZERO = '00000000-0000-0000-0000-000000000000';

async function main() {
  // Clear catalog (cascades to lessons, quizzes, saves/enrollments referencing them).
  await supabase.from('quizzes').delete().neq('id', ZERO);
  await supabase.from('lessons').delete().neq('id', ZERO);
  await supabase.from('courses').delete().neq('id', ZERO);
  await supabase.from('opportunities').delete().neq('id', ZERO);
  await supabase.from('tags').delete().neq('slug', '');

  // Tags
  const { error: tErr } = await supabase.from('tags').insert(SEED_TAGS);
  if (tErr) throw tErr;
  console.log(`✓ ${SEED_TAGS.length} tags`);

  // Opportunities. Batch inserts union keys across rows, so a missing `featured`
  // becomes NULL (not the column default) — normalize it to keep the NOT NULL happy.
  const opportunities = SEED_OPPORTUNITIES.map((o) => ({ featured: false, ...o }));
  const { error: oErr } = await supabase.from('opportunities').insert(opportunities as never);
  if (oErr) throw oErr;
  console.log(`✓ ${SEED_OPPORTUNITIES.length} opportunities`);

  // Courses → lessons → quizzes
  for (const c of SEED_COURSES) {
    const { data: course, error: cErr } = await supabase
      .from('courses')
      .insert({
        slug: c.slug, title: c.title, summary: c.summary, description: c.description,
        subject: c.subject, difficulty: c.difficulty, tags: c.tags, estimated_hours: c.estimated_hours,
      })
      .select()
      .single();
    if (cErr) throw cErr;

    for (let i = 0; i < c.lessons.length; i++) {
      const ls = c.lessons[i];
      const { data: lesson, error: lErr } = await supabase
        .from('lessons')
        .insert({
          course_id: course.id, position: i + 1, title: ls.title, content_type: ls.content_type,
          video_url: ls.video_url ?? null, body: ls.body, materials: ls.materials ?? [],
          duration_min: ls.duration_min ?? null,
        })
        .select()
        .single();
      if (lErr) throw lErr;

      if (ls.quiz) {
        const { error: qErr } = await supabase.from('quizzes').insert({
          lesson_id: lesson.id, title: ls.quiz.title ?? null,
          passing_score: ls.quiz.passing_score ?? 70, questions: ls.quiz.questions,
        });
        if (qErr) throw qErr;
      }
    }
    console.log(`✓ course ${c.slug} (${c.lessons.length} lessons)`);
  }
  console.log('Seed complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
