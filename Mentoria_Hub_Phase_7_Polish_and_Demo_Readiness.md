# Mentoria Hub — Phase 7: Polish & Demo-Readiness (Final Phase)

> **Format:** architecture and the concrete final result only — no code. Defines the finishing surfaces, the consistency sweeps, the demo priming, and the deploy hardening that make the MVP submission-ready against all five rubric criteria.

**Goal of Phase 7:** take the working product from Phases 0–6 and make it *land* — a real high-design landing page, uniform empty/loading/error states everywhere, a full responsive + accessibility pass, finished motion, the exact demo accounts and data seeded so the four-minute thread runs flawlessly, and hardened deployment. After this, the build is ready to submit.

**Why this phase matters disproportionately:** Functionality and UX (45%) are largely earned in Phases 2–6, but **Impact + Problem Understanding (40%)** are won by whether the *product itself* communicates that it solves Mentoria's real problem and scales. The landing page and the demo thread are where that story gets told — so this phase is not "nice-to-have polish," it's where nearly half the score is decided.

---

## 1. Scope

**In scope:** the real landing page; a consistency sweep of every empty/loading/error/not-found state; the cross-phase responsive and accessibility pass; motion finishing with reduced-motion support; demo seeding (two student accounts + an admin + a ready-to-publish draft olympiad); a demo-spine rehearsal; and Vercel deploy hardening (env, production OAuth redirects, error boundaries, metadata/SEO/OG, performance).

**Out of scope:** the pitch deck and the 4-minute video themselves (those are your deliverables — this phase makes the product *support* them flawlessly, per the master plan's "ignore the deck, make the product so the slides write themselves"). Optional toggles parked earlier (public certificate sharing, per-question quiz feedback, role management, activity streak) remain optional and can be switched on if time allows.

---

## 2. The landing page — concrete final result

Public, at the locale root (`/[locale]`), replacing the Phase 0 placeholder. Strict monochrome at full strength — this is the most "Vercel-native" surface in the product: enormous Geist type, hairline rules, vast whitespace, sharp geometry, no decoration that isn't load-bearing.

Sections, top to bottom:

- **Hero.** A confident headline stating the value in one line ("Every opportunity. Every course. One place to grow." / a strong RU equivalent), a subhead naming *what it is and who it's for* (a hub where students in grades 8–11 in Kazakhstan and beyond discover opportunities and learn on their own schedule), and the brief's **three CTAs**: "Find opportunities" and "Start learning" (primary monochrome buttons into the catalog/courses) plus "Join Mentoria" (sign in). The header carries the language switcher and theme toggle. An optional restrained product visual (a real screenshot of the dashboard, the one place the brand accent peeks through, or an abstract monochrome geometric motif).
- **The problem → the solution.** A short, honest narrative block that names the real pain from the brief — opportunities scattered across chats and channels, not everyone able to attend live sessions, hard to know what fits — and answers it: one personalized place for discovery + asynchronous learning. This block is doing direct work for the Problem-Understanding score; it should read like the team understands Mentoria's situation, not like generic EdTech copy.
- **The two engines + personalization.** Three concise feature blocks, each a line of copy + a small visual: *Discover* (catalog, filters, save, deadlines), *Learn* (async courses, progress, certificates), *Personalized* (recommendations, roadmap, AI mentor).
- **For students / For Mentoria.** A short two-column framing that speaks to both audiences — students get clarity and a plan; Mentoria gets scale beyond Telegram, one organized place, and a professional face for partners and schools. This is the Impact narrative, stated plainly.
- **Trust/scale strip.** One line: trilingual (Русский · English · Қазақша), works on any device, learn anytime.
- **Closing CTA.** The three CTAs repeated.

Trilingual, fully responsive, accessible. The landing chrome stays monochrome; the brand accent only appears *inside* an embedded product screenshot (e.g., a progress bar), never in the page's own UI.

---

## 3. Consistency sweep — every state, uniform

A pass across all six prior phases so nothing feels half-finished (this is pure UX score):

- **Loading:** every data region has a skeleton that matches the real layout footprint (no layout shift). Route-level `loading` states exist for catalog, courses, dashboard, calendar, roadmap, admin, and detail pages.
- **Empty:** every list/grid has an intentional empty state with a constructive CTA — opportunities (clear filters), saved (browse opportunities), enrollments (start a course), calendar (save opportunities), roadmap (generate/add), certificates (complete a course), admin lists (create first). No raw blank regions anywhere.
- **Error:** route-level error boundaries with a calm "something went wrong / try again" and a global fallback; the AI surfaces use their deterministic fallbacks (Phase 5); mutations show error toasts and revert optimistic UI.
- **Not found:** a styled `not-found` page (and per-segment where it matters — unknown opportunity/course) instead of a default 404.
- **Toasts, focus rings, badges, buttons:** audited for one consistent treatment across the whole app.

---

## 4. Responsive & accessibility pass — cross-phase

- **Responsive:** verify every screen at mobile / tablet / desktop — the filter rail → sheet, the lesson sidebar → drawer, the calendar → agenda, the roadmap lanes → scroll/stack, the admin tables → scroll/card, and the sticky mobile action bars (Apply, lesson controls). No horizontal overflow, no broken layouts, tap targets comfortable.
- **Accessibility:** a skip-to-content link; semantic landmarks and heading order on every page; all icon-only controls labeled; forms fully labeled with grouped fieldsets; quiz/option and correct-answer controls as proper radio groups; visible focus throughout; meaning never conveyed by color alone (progress and status carry text + glyph); `prefers-reduced-motion` respected; language attribute set per locale; images/embeds have text alternatives. Monochrome high-contrast comfortably clears WCAG AA.

---

## 5. Motion finishing

- One shared motion vocabulary: consistent durations and easing for page/route transitions, drawer/sheet slides, card hovers, and the few **accent moments** (progress fill, quiz pass, completion celebration, certificate seal) tuned to feel earned but quick.
- `prefers-reduced-motion` disables non-essential motion globally.
- Nothing decorative or slow — the credibility is in responsiveness and restraint.

---

## 6. Demo seeding — prime the four-minute thread

Because the two student demo accounts are real Google accounts, the flow is: sign each demo account in once (so its `profiles` row exists), capture the user ids, then run a small **demo-prime** step (script or admin UI/SQL keyed to those ids) that sets up:

- **A "fresh" demo student** — *not* onboarded, so the demo can perform onboarding live (the strongest "the hub materializes" beat). Nothing saved/enrolled.
- **A "primed" demo student (backup + richness)** — onboarded (e.g., grade 10, interests STEM + Business, subjects Math + SAT), with one saved hackathon, one course enrolled at ~50% progress, and optionally one earned certificate — so a full, lived-in dashboard is one click away if a live step misbehaves.
- **An admin account** with a **pre-created *draft* olympiad** (unpublished, tagged to match the demo student's interests). In the demo the admin simply flips it to Published — a clean, low-risk version of "admin adds an olympiad" that avoids filling a whole form live, then "Back to student view" shows it in recommendations.

Keep the seeded catalog (Phase 1) intact underneath; demo-prime only adds the per-account state and the one draft.

---

## 7. The demo thread the product is built to support (suggested run-of-show)

You own the video; this is the thread Phase 7 ensures runs flawlessly:

- **0:00 Landing** — value prop in one screen; click "Find opportunities" / sign in (fresh account).
- **0:25 Onboarding** — grade, interests, subjects, goals → "building your hub."
- **0:55 First-run dashboard** — recommendations appear with the plain-language "why."
- **1:20 Save** a hackathon from the recommendations/catalog → show it on the dashboard and calendar.
- **1:45 Learn** — open a recommended course → a lesson → pass the quiz → the progress bar fills (first accent moment).
- **2:25 Certificate** — finish the course (or resume the primed account near 100%) → the certificate (accent seal).
- **2:50 AI mentor** — ask "what should I do next year?" → grounded answer referencing real items → add to roadmap.
- **3:20 Admin** — switch accounts → publish the pre-drafted olympiad.
- **3:35 Loop closed** — "Back to student view" → the new olympiad is in recommendations.
- **3:50 Close** — switch RU ↔ Қазақша ↔ English live; a quick mobile shot.

Each beat maps to a checklist item and a rubric criterion; rehearse it twice end-to-end before recording.

---

## 8. Vercel deploy hardening

- **Env vars** set in Vercel for all environments: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (seed/CI only — not needed at runtime), `ANTHROPIC_API_KEY`.
- **Production OAuth (resolves the Phase 0 placeholder):** with the real production domain, add it to Google Cloud (Authorized JavaScript origins + the Supabase callback under redirect URIs) and to Supabase → URL Configuration (Site URL + `https://<domain>/**`, plus the Vercel preview wildcard). **This is the one outstanding human input — I still need the real domain to make these exact.**
- **Error boundaries & metadata:** route `error`/`global-error`/`not-found` in place; per-locale `<title>`/description, an Open Graph image, favicon, and `hreflang` alternates for ru/en/kk.
- **Performance:** server-rendered catalog/dashboard, optimized images, Geist via the font pipeline, no major layout shift; a Lighthouse pass on the key pages.
- **Security sanity:** confirm the secret/service key is never in a client bundle, RLS holds for anonymous and cross-user access, and the AI endpoint enforces auth + rate limit.
- **Optional:** Vercel Analytics; a status/health note.

---

## 9. Build prompts (architecture-level requests + acceptance)

**BP7-1 — Landing page.** Build the public landing (§2) with the hero + three CTAs, problem→solution, engines, audiences, trust strip, and closing CTA; trilingual, responsive, monochrome. *Acceptance:* the three brief CTAs work; the page reads as a real EdTech product (not a template) and states the problem/solution and audience clearly in all three locales.

**BP7-2 — States sweep.** Add/standardize route `loading`, `error`, `global-error`, and `not-found`, and audit every empty state for a constructive CTA and every list for skeletons (§3). *Acceptance:* no raw blank or unstyled error/404 anywhere; skeletons match layout; AI surfaces fall back; mutations toast + revert on error.

**BP7-3 — Responsive & a11y pass.** Verify and fix every screen across breakpoints and run the accessibility checklist (§4). *Acceptance:* no overflow/broken layouts at mobile/tablet/desktop; keyboard + screen-reader pass on landing, catalog, lesson player, quiz, dashboard, calendar, roadmap, assistant, and admin; reduced-motion respected; WCAG AA contrast.

**BP7-4 — Motion finishing.** Apply the shared motion vocabulary and reduced-motion handling; tune the accent moments (§5). *Acceptance:* consistent, quick transitions; accent moments feel earned; motion off under reduced-motion.

**BP7-5 — Demo seeding + rehearsal.** Build the demo-prime step (fresh student, primed student, admin, draft olympiad) keyed to the real account ids, and rehearse the §7 thread twice. *Acceptance:* the fresh account onboards into a populated first-run dashboard; the primed account shows a lived-in dashboard; publishing the draft olympiad surfaces it in the student's recommendations; the full thread runs without dead ends.

**BP7-6 — Deploy hardening.** Set env vars, wire the production domain into Google + Supabase, add metadata/OG/hreflang and error boundaries, and run Lighthouse + security sanity (§8). *Acceptance:* Google sign-in works on the production domain; no secret key in any client bundle; RLS holds for anon/cross-user; AI endpoint is auth-gated and rate-limited; key pages pass Lighthouse; OG/metadata render per locale.

---

## 10. Final rubric mapping (the finished product)

| Criterion | Weight | Where it's earned |
|---|---|---|
| **MVP Functionality** | 25% | End-to-end working catalog, courses+quizzes+certificates, dashboard, recommendations, admin CRUD — the whole demo spine runs |
| **UX & Design** | 20% | Vercel-native monochrome, the single disciplined accent, consistent states, responsive, accessible, restrained motion |
| **Impact for Mentoria** | 20% | Admin scale engine (publish → live), Telegram-complement narrative, the "For Mentoria" landing block, analytics view |
| **Problem Understanding** | 20% | Unified catalog (scattered info), async courses (can't attend live), recommendations + roadmap (what fits me), admin-without-rebuild (scale) — mirrored in onboarding and landing copy |
| **Innovation & Creativity** | 15% | Grounded AI mentor with graceful fallback, the grades 9–12 roadmap (AI + deterministic), trilingual RU/EN/KK, certificates |

---

## 11. Definition of Done for Phase 7 (and the project)

- The landing page is live, trilingual, monochrome, with the three CTAs, and clearly states problem, solution, and audience.
- Every empty/loading/error/not-found state is intentional and consistent; no blank or unstyled failure anywhere.
- The whole app passes the responsive and accessibility checklist; motion is consistent and reduced-motion-aware.
- Demo accounts and the draft olympiad are seeded; the four-minute thread runs end-to-end without dead ends, rehearsed twice.
- Deployed to the production domain with Google sign-in working there; env, OAuth redirects, metadata/OG/hreflang, and error boundaries all in place; secret key never client-side; RLS verified; AI endpoint auth-gated and rate-limited; Lighthouse pass on key pages.
- Maps cleanly onto all five rubric criteria.

---

## 12. Submission checklist (the brief's deliverables)

- **Working MVP (link):** ✅ the deployed Vercel URL.
- **Brief technical explanation:** a short write-up (stack, architecture, data model, how recommendations and the grounded AI work, how it scales). *I can draft this text for you on request — it's writing, not slides.*
- **Pitch deck (5–8 slides)** and **4-minute video/demo:** yours to produce — the product is built to make them straightforward; the §7 run-of-show is the spine.
- **Minimum MVP checklist (all satisfied):** landing with value prop · 8–10+ opportunities · filters + search · save/favorite · 3 courses with lessons · progress/completion · student dashboard · recommendation logic · admin CRUD · deploy-ready prototype.

---

**That completes the seven-phase build plan (Phases 0–7).** Together the documents take Mentoria Hub from an empty repo to a deployed, trilingual, AI-assisted, admin-scalable MVP that runs the full demo spine and covers every rubric criterion.

Remaining inputs that are yours: the **production domain** (for the exact OAuth redirects), and the optional toggles you may switch on if time allows. Things I can do next on request: draft the **technical explanation** text, run the **Kazakh/Russian translation pass** over the seed and UI strings, or produce a **single consolidated build checklist** across all seven phases.
