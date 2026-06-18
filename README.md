# Mentoria Hub

A trilingual (RU / EN / KK) student platform that brings **opportunities, structured courses, recommendations, an AI mentor, a personal roadmap, certificates, and admin publishing** together in one product for Mentoria.

## Stack

Next.js 16 (App Router, React 19) · TypeScript · Tailwind CSS v4 · shadcn/ui (`base-nova`, neutral, Base UI) · next-intl · `@supabase/ssr` · next-themes · Geist · Framer Motion. Deploy target: Vercel.

## Quick start (zero credentials)

```bash
npm install
npm run dev
```

Open http://localhost:3000. Out of the box the app runs in **dev mock-auth mode** (`NEXT_PUBLIC_DEV_AUTH=true` in `.env.local`): the **Sign in** dialog offers *Sign in as student* / *Sign in as admin*, which unlock the guarded `(app)` and `(admin)` areas without any Supabase setup. This is the swappable-data-layer de-risking in action — see [`src/lib/data/provider.ts`](src/lib/data/provider.ts).

Scripts: `npm run dev` · `npm run build` · `npm run start` · `npm run lint` · `npm run typecheck` · `npm run seed` · `npm run demo:prime`.

## Two runtime modes

| | Dev mock-auth | Supabase |
|---|---|---|
| Trigger | `NEXT_PUBLIC_DEV_AUTH=true`, Supabase vars blank | Supabase vars set (turn dev off) |
| Sign-in | Fake role cookie (student/admin) | Google OAuth + email magic link |
| Data provider | `mockProvider` | `supabaseProvider` |

Auth resolution lives in [`src/lib/auth.ts`](src/lib/auth.ts): dev role-cookie first, then Supabase. Both are guarded by `isSupabaseConfigured()` so a missing key never crashes a request.

## Enabling real auth and data

1. **Supabase project** — create one; note the Project URL, Publishable key (`sb_publishable_…`, or legacy anon), and Secret key.
2. **Google OAuth** (Google Cloud Console → Credentials → OAuth client ID, *Web application*):
   - JS origins: `http://localhost:3000` and your production domain.
   - Redirect URI: the Supabase callback `https://<project-ref>.supabase.co/auth/v1/callback`.
3. **Wire Google into Supabase** → Authentication → Providers → Google (paste client id/secret). Under URL Configuration add redirect patterns `http://localhost:3000/**`, `https://<your-domain>/**`, `https://*-<team>.vercel.app/**`.
4. **Run migrations** with `npm run db:migrate <file.sql ...>` once `SUPABASE_ACCESS_TOKEN` is available, or apply the SQL in `supabase/migrations/` through the Supabase SQL editor. Then run `npm run db:check`.
5. **Env vars** — fill `.env.local` (see `.env.example`) and set `NEXT_PUBLIC_DEV_AUTH=false`.
6. **Seed catalog** — run `npm run seed`.
7. **Become admin** — after your first sign-in: `update public.profiles set role='admin' where email='you@example.com';`

## Demo priming

For the four-minute demo flow, sign each demo Google account in once so its `profiles` row exists, copy the auth user ids into `.env.local`, then run:

```bash
npm run demo:prime
```

The script resets the fresh student to onboarding, prepares a primed student with saves, progress, a certificate, and roadmap items, promotes the admin account, and creates an unpublished Mentoria STEM olympiad draft ready to publish from the admin console. It is idempotent and only changes the accounts named by `DEMO_FRESH_STUDENT_ID`, `DEMO_PRIMED_STUDENT_ID`, and `DEMO_ADMIN_ID`.

## Internationalization

Locales `['ru','en','kk']`, default `ru`, `localePrefix: 'as-needed'` → `/` is Russian, `/en/...` and `/kk/...` are prefixed. UI strings live in [`messages/`](messages); RU is the source of truth. (Kazakh is `kk`, the language code — not the `kz` country code.)

## Project layout

```
src/proxy.ts              # Next 16: composed next-intl routing + Supabase session refresh
src/i18n/                 # routing, request config, locale-aware navigation
src/utils/supabase/       # browser + server clients
src/lib/                  # auth, env, data provider, assistant, admin actions
src/components/shell/      # role-aware header, nav, user menu, sign-in dialog
src/app/[locale]/         # localized routes; (app) = guarded, (admin) = role-gated
src/app/api/assistant/    # grounded AI assistant endpoints with deterministic fallback
src/app/auth/             # OAuth/magic-link callbacks, sign-out, dev sign-in
```

### Notable design decisions (beyond the literal spec)

- **Single root layout** owns `<html>/<body>` (resolving lang via `getLocale()`) so the non-localized `/auth/*` pages render correctly alongside the `[locale]` tree.
- **`proxy.ts` matcher excludes `/auth`** so next-intl never rewrites the OAuth callback under `/[locale]`.
- **Dev mock auth + mock data provider** make the whole app runnable and demoable with no credentials.
- **Magic-link** sign-in is wired alongside Google as a demo-resilience fallback.
- **Grounded AI** is an enhancement, not a dependency: missing Anthropic keys fall back to deterministic recommendations built from real catalog data.
- shadcn shipped the **`base-nova` (Base UI)** style, so composition uses the `render` prop, not `asChild`.

## Deploy (Vercel)

Import the repo, add the same env vars, deploy, then register the final production domain in Google and Supabase. Required runtime vars are `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DEV_AUTH=false`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and optionally `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL`. `SUPABASE_SECRET_KEY` is for seed/demo scripts and CI only; it is not used in client code.
