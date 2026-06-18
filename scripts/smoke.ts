// Phase 1 smoke test (BP1-8). Uses the ANON key so it also verifies anon RLS.
//   npx tsx scripts/smoke.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon) {
  console.error('Missing Supabase URL or anon/publishable key in .env.local');
  process.exit(1);
}

const supabase = createClient(url, anon, { auth: { persistSession: false } });

let failures = 0;
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

async function main() {
  // anon reads the public catalog
  const { count: oppCount } = await supabase
    .from('opportunities')
    .select('id', { count: 'exact', head: true })
    .eq('is_published', true);
  check('anon reads opportunities; count = 10', (oppCount ?? 0) === 10, `count=${oppCount}`);

  const { count: tagCount } = await supabase
    .from('tags')
    .select('slug', { count: 'exact', head: true });
  check('tags count = 18', (tagCount ?? 0) === 18, `count=${tagCount}`);

  const { count: courseCount } = await supabase
    .from('courses')
    .select('id', { count: 'exact', head: true })
    .eq('is_published', true);
  check('courses count = 3', (courseCount ?? 0) === 3, `count=${courseCount}`);

  // sat-ebrw with its lessons
  const { data: course } = await supabase
    .from('courses')
    .select('*, lessons(*)')
    .eq('slug', 'sat-ebrw')
    .maybeSingle();
  const lessonCount = (course as { lessons?: unknown[] } | null)?.lessons?.length ?? 0;
  check('sat-ebrw has 4 lessons', lessonCount === 4, `lessons=${lessonCount}`);

  // recommendation ranks tag-overlap first
  const { data: rec, error: recErr } = await supabase.rpc('recommend_opportunities', {
    p_interests: ['stem', 'math'],
    p_grade: 11,
    p_limit: 8,
  });
  if (recErr) {
    check('recommend_opportunities RPC works', false, recErr.message);
  } else {
    const top = (rec ?? [])[0] as { title?: { en?: string }; tags?: string[] } | undefined;
    const topTagged = !!top?.tags && (top.tags.includes('stem') || top.tags.includes('math'));
    check('recommend returns results', (rec?.length ?? 0) > 0, `n=${rec?.length ?? 0}`);
    check('recommend ranks STEM/math-tagged first', topTagged, top ? `top="${top.title?.en}"` : 'none');
  }

  // RLS: anon must not read another user's saved opportunities
  const { data: saves, error: saveErr } = await supabase.from('saved_opportunities').select('*');
  check('anon cannot read saved_opportunities (RLS)', !saveErr && (saves?.length ?? 0) === 0, `rows=${saves?.length ?? 0}`);

  console.log(failures === 0 ? '\n✅ All smoke checks passed.' : `\n❌ ${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
