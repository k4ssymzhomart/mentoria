// Applies SQL migration files via the Supabase Management API over HTTPS.
// Needs SUPABASE_ACCESS_TOKEN (a Personal Access Token, sbp_…) in .env.local.
//   node scripts/apply-migrations.mjs supabase/migrations/0001_init.sql ...
import { readFileSync } from 'node:fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ref = url.replace(/^https?:\/\//, '').split('.')[0];
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!ref) {
  console.error('Could not derive project ref from NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}
if (!token) {
  console.error('Set SUPABASE_ACCESS_TOKEN (a Personal Access Token, sbp_…) in .env.local');
  process.exit(1);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/apply-migrations.mjs <file.sql> [<file.sql> ...]');
  process.exit(1);
}

for (const file of files) {
  const query = readFileSync(file, 'utf8');
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`✗ ${file} — ${res.status}: ${text}`);
    process.exit(2);
  }
  console.log(`✓ applied ${file}`);
}
console.log('All migrations applied.');
