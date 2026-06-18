// src/proxy.ts — Next.js 16. Lives in src/ (same level as app/) so Next picks it up.
// Next 16 renamed `middleware.ts` -> `proxy.ts` and the export `middleware` -> `proxy`.
// next-intl routing and Supabase session refresh are composed into this one handler.
import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import { SUPABASE_URL, SUPABASE_KEY, isSupabaseConfigured } from '@/lib/env';

const handleI18n = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // 1) i18n first: resolve the locale, possibly redirect (`/` -> default) or rewrite
  //    the internal path to `/[locale]/...` so the App Router can resolve it.
  const response = handleI18n(request);

  // 2) Refresh the Supabase session, writing any rotated cookies onto the i18n response.
  //    Skipped entirely until Supabase is configured, so dev-mock mode stays crash-free.
  if (isSupabaseConfigured()) {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          ),
      },
    });
    // Touches the session; refreshes the access token if it has expired.
    await supabase.auth.getClaims();
  }

  return response;
}

export const config = {
  // Everything except API routes, Next internals, static files, and the /auth/* handlers.
  // `auth` is excluded so next-intl never rewrites the OAuth/magic-link callbacks under /[locale].
  matcher: '/((?!api|trpc|_next|_vercel|auth|.*\\..*).*)',
};
