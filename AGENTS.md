<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Mentoria Hub (Phase 0)

Trilingual (RU/EN/KK) student platform. Next 16 + Tailwind v4 + shadcn (`base-nova`/**Base UI**) + next-intl + Supabase.

Conventions that bite if ignored:

- **Base UI, not Radix.** Compose with the `render` prop (`<Button render={<Link/>}>`), never `asChild`.
- **Middleware is `proxy.ts`** at the repo root (export `proxy`), composing next-intl + Supabase refresh. Its matcher excludes `/auth`.
- **One root layout** (`src/app/layout.tsx`) owns `<html>/<body>` for both `[locale]/*` and `/auth/*`; locale comes from `getLocale()`.
- **All data access goes through `src/lib/data/provider.ts`** (`db`), never the Supabase client directly. `db` is `mock` or `supabase` by config.
- **Auth** is in `src/lib/auth.ts`: dev role-cookie first (`NEXT_PUBLIC_DEV_AUTH=true`), then Supabase. Guards: `(app)` → `requireUser()`, `(admin)` → `requireAdmin()`.
- **Locale code is `kk`** (never `kz`). Default locale `ru` is unprefixed.
- The single brand accent is `bg-brand` / `text-brand-foreground`; everything else is monochrome. Primary buttons stay monochrome.

## Phase 1 (data model & seed) — done

- **Content text is JSONB** `{ en, ru, kk }` on the row (titles, summaries, lesson bodies, quiz prompts). Read it with `tl(value, locale)` from `@/lib/data/types` — named `tl`, NOT `t`, to avoid clashing with next-intl's `t` in components. UI chrome stays in `messages/*.json`.
- **Tags** are `text[]` of slugs on each row; the `tags` table is the dictionary only. Recommendations = array overlap (`&&`) via the `recommend_*` RPCs.
- **DB migrations** live in `supabase/migrations/`. Apply with `npm run db:migrate <file.sql ...>` (Supabase Management API over HTTPS; needs `SUPABASE_ACCESS_TOKEN` in `.env.local`). Direct Postgres (5432/pooler) is unreachable from this network. After DDL, PostgREST's schema cache can lag a few seconds → `PGRST205`; re-check with `npm run db:check`. Seed with `npm run seed`, verify with `npm run smoke`.
- Catalog reads / student-state go through `db` (supabase-provider, `server-only`). Admin methods throw `'Phase 6'`. Quiz `correct` is stripped in `getLessonForLearner`; grading is the `grade_quiz` RPC.

