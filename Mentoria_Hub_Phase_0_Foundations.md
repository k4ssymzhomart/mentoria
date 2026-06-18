# Mentoria Hub — Phase 0: Foundations

**Goal of Phase 0:** stand up the skeleton that every later phase plugs into — a deployable Next.js 16 app, the strict-monochrome design system with one surgical accent, trilingual routing (RU / EN / KK), Google auth via Supabase with a role-aware profile, a swappable data layer, and a role-aware app shell. No product features yet. When Phase 0 is done, an empty-but-real product runs locally and on Vercel, you can sign in with Google, your profile row exists with a `role`, and admin routes are gated.

> **Stack baseline (verified current, June 2026):** Next.js 16 (App Router, React 19), TypeScript, Tailwind CSS v4 (CSS-first config), shadcn/ui (`new-york`, `neutral` base), next-intl (locale routing), `@supabase/ssr` + `@supabase/supabase-js`, next-themes, Geist font, Framer Motion. Deploy: Vercel.

---

## 0. Three gotchas baked into this spec (so you don't lose hours)

1. **`middleware.ts` → `proxy.ts`.** Next.js 16 renamed the middleware file to `proxy.ts` and the convention export to `proxy`. next-intl routing **and** Supabase session refresh both need to run there, so they are **composed into a single `proxy.ts`** (Section 6). If you end up on Next 15, name the file `middleware.ts` and the function `middleware` — the body is identical.
2. **Tailwind v4 has no `tailwind.config.js`.** All design tokens live in `app/globals.css` under `:root` / `.dark` and are exposed to utilities via `@theme inline`. In `components.json`, `tailwind.config` is left blank.
3. **Kazakh's language code is `kk`, not `kz`.** `kz` is the *country* code. Every locale array, message filename, and URL segment uses `kk`.

---

## 1. Prerequisites — the human-only setup (do these first; nothing else works without them)

These are the steps only you can do (accounts, OAuth credentials, secrets). Do them before or alongside Build Prompt 1.

### 1.1 Supabase project
- Create a project at supabase.com. Note the **Project URL** and the **Publishable key** (`sb_publishable_…`; the legacy `anon` key still works through end of 2026 if you see that instead).
- You'll also need the **Secret key** (`sb_secret_…` / legacy `service_role`) later for admin server actions and seeding — keep it server-only, never `NEXT_PUBLIC_`.

### 1.2 Google OAuth (Google Cloud Console)
- APIs & Services → Credentials → **Create OAuth client ID** → *Web application*.
- **Authorized JavaScript origins:** `http://localhost:3000` and your Vercel domain (e.g. `https://mentoria-hub.vercel.app`).
- **Authorized redirect URIs:** add the **Supabase callback** shown in Supabase → Authentication → Providers → Google. It looks like `https://<project-ref>.supabase.co/auth/v1/callback`.
- Copy the **Client ID** and **Client secret**.

### 1.3 Wire Google into Supabase
- Supabase → Authentication → Providers → **Google** → enable → paste Client ID + Secret.
- Supabase → Authentication → **URL Configuration** → under **Redirect URLs** add wildcard patterns: `http://localhost:3000/**`, `https://mentoria-hub.vercel.app/**`, and `https://*-<your-team>.vercel.app/**` (for preview deploys). Set **Site URL** to your primary domain.

### 1.4 Environment variables (`.env.local`, and the same in Vercel → Project → Settings → Env Vars)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx   # or the legacy anon key
SUPABASE_SECRET_KEY=sb_secret_xxx                         # server only — used for seeding/admin
# Phase 5 (AI) will add: ANTHROPIC_API_KEY=...
```

### 1.5 Make yourself admin (after first sign-in)
There is no public "become admin" path (correct for security). After you sign in once, open Supabase → Table editor → `profiles`, find your row, set `role = 'admin'`. That's your demo admin account. Seed a second Google account as the demo student.

### 1.6 Vercel
- Import the repo, add the same env vars, deploy. Add the resulting domain to Google origins/redirects (1.2) and Supabase redirect URLs (1.3).

**What I need confirmed from you on this section:** the production domain you'll use (so the redirect URLs are exact), and whether you want me to also scaffold **email magic-link** as a fallback sign-in alongside Google (recommended for demo resilience — if Google OAuth misbehaves live, magic link saves the demo).

---

## 2. Target folder structure (end of Phase 0)

```
mentoria-hub/
├── proxy.ts                      # Next 16: composed next-intl + Supabase session refresh
├── next.config.ts                # next-intl plugin
├── components.json               # shadcn config (tailwind.config left blank for v4)
├── messages/
│   ├── ru.json                   # default / demo locale
│   ├── en.json
│   └── kk.json
└── src/
    ├── app/
    │   ├── globals.css           # Tailwind v4 + shadcn tokens + brand accent + fonts
    │   ├── auth/
    │   │   ├── callback/route.ts # exchangeCodeForSession
    │   │   └── auth-code-error/page.tsx
    │   └── [locale]/
    │       ├── layout.tsx        # locale layout: providers, fonts, html lang
    │       ├── page.tsx          # placeholder landing (real one = Phase 7)
    │       ├── (app)/            # authed student area (guarded) — empty shells now
    │       │   └── layout.tsx
    │       └── (admin)/          # admin area (role-gated) — empty shell now
    │           └── layout.tsx
    ├── components/
    │   ├── ui/                   # shadcn components land here
    │   ├── theme-provider.tsx
    │   ├── theme-toggle.tsx
    │   ├── locale-switcher.tsx
    │   └── shell/                # header, nav, user-menu
    ├── i18n/
    │   ├── routing.ts
    │   ├── request.ts
    │   └── navigation.ts         # locale-aware <Link>, useRouter, redirect
    ├── lib/
    │   ├── auth.ts               # getSessionUser(), getProfile(), requireAdmin()
    │   ├── utils.ts              # cn()
    │   └── data/                 # the swappable data-access layer
    │       ├── types.ts          # entity TS types (grows each phase)
    │       ├── provider.ts       # DataProvider interface + active provider export
    │       └── supabase-provider.ts
    └── utils/supabase/
        ├── client.ts             # createBrowserClient
        └── server.ts             # createServerClient (async cookies)
```

> **Architectural rule that pays off later:** components never import the Supabase client directly. All reads/writes go through `lib/data/provider.ts`. That single indirection is what lets us swap to a mock provider if Supabase ever becomes a time sink before the demo — de-risking without a rewrite.

---

## 3. Design system — strict monochrome + one surgical accent

**Principle:** the entire UI is black / white / neutral-gray. Exactly **one** chromatic color exists — the **brand accent** — and it is reserved *only* for: progress fills, completion/success states, the active nav indicator, and the certificate seal. **Primary buttons stay monochrome** (solid near-black in light mode, solid near-white in dark mode). This is what makes it read as Vercel-native rather than "a colorful EdTech site."

- **Base palette:** shadcn `neutral` base color (already grayscale, OKLCH).
- **Accent (the only color):** emerald, `oklch(0.62 0.17 150)` light / `oklch(0.72 0.17 150)` dark. Tune the hue to taste — it's one token. Green reads as "growth/progress," which fits a learning product. Don't introduce a second hue.
- **Radius:** `--radius: 0.25rem` (crisp; set to `0` for maximum sharpness). Minimal rounding everywhere.
- **Borders:** 1px hairlines using shadcn `--border` (light: near `oklch(0.92 0 0)`, dark: subtle). Lean on borders and whitespace, not shadows.
- **Type:** Geist Sans (UI) + Geist Mono (numbers, codes, deadlines). Large type scale, tight heading tracking, generous negative space.
- **Motion:** Framer Motion, restrained — progress bar fill, page fade/slide, the certificate reveal. Nothing bouncy.
- **Dark/light:** ships now via `next-themes`; trivial because the base is monochrome.

### `app/globals.css` — the parts you add on top of what `shadcn init` generates
```css
@import "tailwindcss";
@import "tw-animate-css";
@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.25rem;
  /* …shadcn neutral scaffold (background, foreground, primary, border, etc.) is generated by init… */

  /* The ONE accent. Do NOT reuse shadcn's --accent (that's a neutral hover surface). */
  --brand: oklch(0.62 0.17 150);
  --brand-foreground: oklch(0.985 0 0);
}
.dark {
  /* …shadcn .dark scaffold… */
  --brand: oklch(0.72 0.17 150);
  --brand-foreground: oklch(0.18 0 0);
}

@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  /* …shadcn --color-* mappings generated by init… */
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
}
```
Usage: progress fill / success → `bg-brand text-brand-foreground`; CTAs → default `bg-primary text-primary-foreground` (monochrome).

---

## 4. Internationalization (RU / EN / KK)

- **Locales:** `['ru', 'en', 'kk']`, **defaultLocale: `ru`** (demo + judges), `localePrefix: 'as-needed'` → Russian URLs are clean (`/`, `/dashboard`), English/Kazakh are prefixed (`/en/dashboard`, `/kk/dashboard`).
- **Message files:** `messages/{ru,en,kk}.json`, organized by namespace (`common`, `nav`, `landing`, `onboarding`, `opportunities`, `courses`, `dashboard`, `admin`). RU is the source of truth (we read it); EN/KK get drafted and RU-checked.
- **Data vs. UI strings:** UI chrome → message files. Seeded content (opportunity titles, course descriptions) → translation fields *on the data rows* (Phase 1), so admins can localize content without code.

### `next.config.ts`
```ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin();
const nextConfig: NextConfig = {};
export default withNextIntl(nextConfig);
```

### `src/i18n/routing.ts`
```ts
import { defineRouting } from 'next-intl/routing';
export const routing = defineRouting({
  locales: ['ru', 'en', 'kk'],
  defaultLocale: 'ru',
  localePrefix: 'as-needed',
});
```

### `src/i18n/request.ts`
```ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return { locale, messages: (await import(`../../messages/${locale}.json`)).default };
});
```

### `src/i18n/navigation.ts`
```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
```

### `src/app/[locale]/layout.tsx`
```tsx
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from '@/components/theme-provider';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={locale} suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## 5. Supabase clients

### `src/utils/supabase/client.ts` (browser)
```ts
import { createBrowserClient } from '@supabase/ssr';
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```

### `src/utils/supabase/server.ts` (server components, actions, route handlers)
```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* called from a Server Component; proxy refreshes the session */ }
        },
      },
    },
  );
}
```

---

## 6. The composed `proxy.ts` (next-intl routing + Supabase session refresh)

```ts
// proxy.ts  (project root) — Next.js 16
import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

const handleI18n = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // 1) i18n first: resolves locale, may redirect (/ -> /ru) or rewrite.
  const response = handleI18n(request);

  // 2) Refresh the Supabase session, writing refreshed cookies onto the i18n response.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    },
  );
  await supabase.auth.getClaims(); // refreshes token if expired

  return response;
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
```
> If you're on Next 15: rename to `middleware.ts`, export `middleware`. Body unchanged.

---

## 7. Auth flow, helpers, and role gating

### Sign in (client) — `components/shell/sign-in-button.tsx`
```ts
const supabase = createClient(); // browser
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${location.origin}/auth/callback?next=/dashboard` },
});
```

### Callback — `src/app/auth/callback/route.ts`
```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
```

### Server helpers — `src/lib/auth.ts`
```ts
import { createClient } from '@/utils/supabase/server';
import { redirect } from '@/i18n/navigation';

export async function getSessionUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user; // null if signed out
}

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return data;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect({ href: '/', locale: 'ru' });
  return user;
}

export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== 'admin') redirect({ href: '/', locale: 'ru' });
  return profile;
}
```
- `(app)/layout.tsx` calls `requireUser()`.
- `(admin)/layout.tsx` calls `requireAdmin()`.
- `proxy.ts` only refreshes the session; **route groups enforce access** (cleaner than gating in the proxy).

### Database: profiles, role, RLS, signup trigger (run in Supabase SQL editor)
```sql
create type public.user_role as enum ('student', 'admin', 'mentor');

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  role        public.user_role not null default 'student',
  grade       int,
  interests   text[] not null default '{}',
  subjects    text[] not null default '{}',
  goals       text[] not null default '{}',
  locale      text not null default 'ru',
  onboarded   boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- SECURITY DEFINER avoids RLS recursion when policies need the caller's role.
create or replace function public.is_admin() returns boolean
  language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create policy "read own profile"    on public.profiles for select using (auth.uid() = id);
create policy "update own profile"  on public.profiles for update using (auth.uid() = id);
create policy "admins read all"     on public.profiles for select using (public.is_admin());

-- Auto-create a profile row when a Google user signs up.
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (new.id,
          new.raw_user_meta_data->>'full_name',
          new.email,
          new.raw_user_meta_data->>'avatar_url');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();
```

---

## 8. The swappable data layer (scaffold only in Phase 0)

### `src/lib/data/provider.ts`
```ts
// Entity methods are added phase by phase. Phase 0 ships the interface + Supabase binding.
export interface DataProvider {
  // Phase 1+: getOpportunities(filters), getCourse(id), saveOpportunity(...), enroll(...), etc.
}
import { supabaseProvider } from './supabase-provider';
export const db: DataProvider = supabaseProvider;
```
Everything that touches data imports `db` from here. A future `mockProvider` implementing the same interface is a one-line swap.

---

## 9. App shell (role-aware)

- **Header:** wordmark "Mentoria Hub" (Geist, tight tracking) · primary nav · right cluster = **locale switcher** (RU/EN/KK) + **theme toggle** + **user menu / Sign in with Google**.
- **Nav is role-aware:** signed-out → Opportunities, Courses, "Sign in"; student → Dashboard, Opportunities, Courses, Roadmap, Calendar; admin → adds an "Admin" entry. Active item uses the **brand** accent underline (the accent's first appearance).
- **Locale switcher** uses `usePathname`/`useRouter` from `i18n/navigation` to swap locale while preserving the path.
- **Theme toggle** flips `next-themes` (sun/moon, system option).
- Build empty route shells now: `(app)/dashboard`, `/opportunities`, `/courses`, `(app)/roadmap`, `(app)/calendar`, `(admin)` — each a titled empty page with a skeleton. Real content arrives in later phases.

---

## 10. Ordered build prompts (hand these to your coding agent, in order)

> Each is self-contained and ends with an acceptance check. Run them sequentially; commit after each.

**BP-1 — Project init.**
"Create a Next.js 16 app with TypeScript, App Router, Tailwind v4, ESLint, and the `src/` directory (`npx create-next-app@latest mentoria-hub --typescript --tailwind --eslint --app --src-dir`). Then `npx shadcn@latest init` choosing style `new-york`, base color `neutral`, CSS variables yes. Install: `npm i @supabase/ssr @supabase/supabase-js next-intl next-themes geist framer-motion`. Add shadcn components: `button card input label select dialog dropdown-menu badge progress skeleton sonner avatar tabs sheet`. Acceptance: dev server runs; a shadcn `<Button>` renders."

**BP-2 — Design tokens & fonts.** "Edit `src/app/globals.css` per Section 3: set `--radius: 0.25rem`, add `--brand`/`--brand-foreground` for `:root` and `.dark`, and expose `--color-brand`, `--color-brand-foreground`, `--font-sans`, `--font-mono` in `@theme inline`. Wire Geist Sans/Mono variables in the root html className. Acceptance: a `bg-brand` div is emerald in both themes; body font is Geist."

**BP-3 — i18n.** "Add `next.config.ts`, `src/i18n/{routing,request,navigation}.ts`, and `messages/{ru,en,kk}.json` with a `common`+`nav` namespace, per Section 4. Move pages under `src/app/[locale]/` with the locale `layout.tsx`. Acceptance: `/` renders RU, `/en` renders EN, `/kk` renders KK; unknown locale 404s."

**BP-4 — Supabase clients + composed proxy.** "Add `src/utils/supabase/{client,server}.ts` and root `proxy.ts` composing next-intl routing with Supabase session refresh, per Sections 5–6. Acceptance: app still routes; no cookie/hydration errors in console."

**BP-5 — Auth + profiles + RLS.** "Run the SQL in Section 7 in Supabase. Add `src/app/auth/callback/route.ts`, an `auth-code-error` page, `src/lib/auth.ts`, and a Google sign-in button. Acceptance: Sign in with Google works; a `profiles` row is auto-created; signing out works."

**BP-6 — Route groups + guards.** "Create `(app)` and `(admin)` route groups with layouts calling `requireUser()` and `requireAdmin()`. Add empty titled shells for dashboard, opportunities, courses, roadmap, calendar, and admin. Acceptance: signed-out users hitting `/dashboard` are redirected; non-admins hitting `/admin` are redirected; after setting your role to `admin` in Supabase, `/admin` loads."

**BP-7 — App shell.** "Build the role-aware header (Section 9): wordmark, role-aware nav with brand-accent active state, locale switcher, theme toggle, user menu / sign-in. Acceptance: nav changes by auth state and role; locale switch preserves path; theme toggle persists."

**BP-8 — Data-layer scaffold + deploy.** "Add `src/lib/data/{types,provider,supabase-provider}.ts` with the empty `DataProvider` interface and `db` export. Push to GitHub, import to Vercel, add env vars, deploy; register the Vercel domain in Google + Supabase redirect settings. Acceptance: production URL loads, Google sign-in works on the deployed domain."

---

## 11. Definition of Done for Phase 0

- App runs locally and on Vercel, no console errors.
- `/`, `/en`, `/kk` all render; locale switcher preserves the current path.
- Dark/light toggle works and persists; the only color anywhere is the brand accent (active nav).
- Google sign-in works on both localhost and the deployed domain; a `profiles` row auto-creates with `role='student'`.
- Setting `role='admin'` in Supabase unlocks `/admin`; signed-out users are redirected from `(app)` and `(admin)`.
- All data access is routed through `lib/data/provider.ts` (even though it's empty).

---

## 12. What Phase 1 will cover (preview, for your approval after Phase 0)

Phase 1 = **Data model & seed**: the full schema and TypeScript types for opportunities, courses, lessons, quizzes, enrollments, saved items, certificates, and roadmap items; the shared **tag taxonomy** (the join that powers filters + recommendations + roadmap + AI); RLS for all tables; and seed data — **8–10 opportunities** plus the three courses (**EBRW SAT, IELTS, University Admissions**) with lessons, materials, video placeholders, and quizzes — each with RU/EN/KK content fields. This is the layer everything visible is built on, so it comes before any feature UI.
