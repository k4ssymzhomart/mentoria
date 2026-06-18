import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { safeNext } from '@/lib/safe-redirect';
import { ensureStudentProfile } from '@/lib/auth-profile';
import { absoluteAppUrl } from '@/lib/request-origin';

// OAuth (Google) + PKCE magic-link return here with `?code=...`.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'), '/dashboard');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && await ensureStudentProfile(supabase)) {
      return NextResponse.redirect(absoluteAppUrl(request, next));
    }
  }
  return NextResponse.redirect(absoluteAppUrl(request, '/auth/auth-code-error'));
}
