import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isDevAuthEnabled } from '@/lib/env';
import { DEV_ROLE_COOKIE, isDevRole } from '@/lib/dev-auth';
import { safeNext } from '@/lib/safe-redirect';
import { absoluteAppUrl } from '@/lib/request-origin';

// Developer-only mock sign-in: sets the role cookie and bounces to `next`.
// Inert unless NEXT_PUBLIC_DEV_AUTH=true, so it can never be triggered in prod.
export async function POST(request: Request) {
  if (!isDevAuthEnabled()) {
    return NextResponse.redirect(absoluteAppUrl(request, '/'), { status: 303 });
  }

  const form = await request.formData();
  const role = String(form.get('role') ?? 'student');
  const next = safeNext(String(form.get('next') ?? '/dashboard'), '/dashboard');
  const chosen = isDevRole(role) ? role : 'student';

  const store = await cookies();
  store.set(DEV_ROLE_COOKIE, chosen, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // one week
  });

  return NextResponse.redirect(absoluteAppUrl(request, next), { status: 303 });
}
