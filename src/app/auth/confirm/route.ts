import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { safeNext } from '@/lib/safe-redirect';
import { ensureStudentProfile } from '@/lib/auth-profile';
import { absoluteAppUrl } from '@/lib/request-origin';

// Magic-link / OTP token-hash flow (used when the email template sends
// `?token_hash=...&type=...` instead of a `?code=...` PKCE link).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = safeNext(searchParams.get('next'), '/dashboard');

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error && await ensureStudentProfile(supabase)) {
      return NextResponse.redirect(absoluteAppUrl(request, next));
    }
  }
  return NextResponse.redirect(absoluteAppUrl(request, '/auth/auth-code-error'));
}
