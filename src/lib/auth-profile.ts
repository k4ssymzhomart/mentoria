import 'server-only';
import type { User } from '@supabase/supabase-js';
import type { createClient } from '@/utils/supabase/server';

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

function stringMeta(user: User, key: string): string | null {
  const value = user.user_metadata?.[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

export async function ensureStudentProfile(supabase: ServerSupabase): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (readError) return false;
  if (existing?.id) return true;

  const fullName = stringMeta(user, 'full_name') ?? stringMeta(user, 'name');
  const avatarUrl = stringMeta(user, 'avatar_url') ?? stringMeta(user, 'picture');

  const { error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    full_name: fullName,
    email: user.email ?? null,
    avatar_url: avatarUrl,
    role: 'student',
  });

  return !insertError;
}
