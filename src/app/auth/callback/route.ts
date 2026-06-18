import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { safeNext } from '@/lib/safe-redirect';

// OAuth (Google) + PKCE magic-link return here with `?code=...`.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'), '/dashboard');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
