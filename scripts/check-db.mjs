// Reports which tables exist (over HTTPS, secret key). Diagnoses migration state.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const s = createClient(url, key, { auth: { persistSession: false } });

async function probe(name) {
  const { error, count } = await s.from(name).select('*', { count: 'exact' }).limit(1);
  return error ? `MISSING — ${error.code}: ${error.message}` : `OK (rows=${count})`;
}

const tables = ['profiles', 'tags', 'opportunities', 'courses', 'lessons', 'quizzes', 'enrollments', 'roadmap_items'];
for (const t of tables) console.log(`${t.padEnd(16)} → ${await probe(t)}`);

// Are the Phase 1 RPCs present?
for (const fn of ['recommend_opportunities', 'recommend_courses']) {
  const args = fn === 'recommend_opportunities'
    ? { p_interests: [], p_grade: null, p_limit: 1 }
    : { p_interests: [], p_limit: 1 };
  const { error } = await s.rpc(fn, args);
  console.log(`rpc ${fn.padEnd(24)} → ${error ? `MISSING — ${error.code}: ${error.message}` : 'OK'}`);
}
