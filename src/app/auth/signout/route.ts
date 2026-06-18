import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';
import { DEV_ROLE_COOKIE } from '@/lib/dev-auth';

// POST-only so link prefetch / CSRF can't sign a user out. The user menu submits a form.
export async function POST(request: Request) {
  const { origin } = new URL(request.url);

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  // Clear the dev-mock role cookie too (no-op if it isn't set).
  const store = await cookies();
  store.delete(DEV_ROLE_COOKIE);

  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
