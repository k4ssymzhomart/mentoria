# Mentoria Hub — Phase 6: Operations & Scale (Admin)

> **Format:** architecture and the concrete final result only — no code. Defines surfaces, regions, data flows, states, and finished behavior. Your coding agent implements against it.

**Goal of Phase 6:** the back office that makes Mentoria look like a real, scalable organization — full content management for opportunities and courses (trilingual, tag-aware, publishable), a users list, and a small analytics overview. It implements the `admin*` provider methods that have been stubbed with "Phase 6," and it closes the last loop of the demo spine: **an admin creates and publishes a new olympiad → it appears live in a student's recommendations.** This is the Impact-criterion engine — visible proof the platform grows without anyone touching code.

**Where it sits:** Engine 4 (Operations & Scale). It writes through the provider's admin methods, which are permitted by the Phase 1 RLS policies (admin writes via `is_admin()`), so normal admin CRUD runs with the admin's own session — **no service key in the app** (that stays for offline seeding only). Reads reuse the same provider; admins additionally see unpublished content because the catalog read policies include an `is_admin()` branch.

---

## 1. Scope

**In scope:** the admin dashboard with analytics; opportunities CRUD; courses CRUD including the lesson and quiz editors; publish/unpublish; a users list (with optional role management); trilingual content editing; and role-gated access.

**Out of scope (later):** the public landing page, demo seeding, and deploy hardening (Phase 7); a full mentor portal (architected but not built — only the `mentor` role exists in the data model). Real Telegram/email dispatch remains simulated, as decided in the master plan.

---

## 2. Routes & access (the `(admin)` group, role-gated)

- `/[locale]/admin` — admin dashboard (overview + analytics).
- `/[locale]/admin/opportunities` — opportunities list + create/edit/delete.
- `/[locale]/admin/courses` — courses list.
- `/[locale]/admin/courses/[id]` — course editor (meta + lessons + quizzes).
- `/[locale]/admin/users` — users list.

The `(admin)` layout calls `requireAdmin()` (Phase 0): non-admins and signed-out users are redirected. The header shows the "Admin" nav entry only when the session's role is `admin`. Admins reach this area as their seeded admin account (role set manually in Supabase during Phase 0 setup).

---

## 3. The admin shell

A distinct but consistent back-office layout: the same monochrome system and Geist type, with a left admin nav (Overview · Opportunities · Courses · Users) and a "Back to student view" link so the admin can flip into the student experience (important for the demo's admin↔student switch). The admin area is intentionally calm and table-driven — it should read as a real operations console, not a flashy dashboard.

---

## 4. The admin dashboard — concrete final layout

The Impact story in one screen:

- **Stat strip:** monochrome stat cards — total users, published opportunities, published courses, total enrollments, course completions, and saved-opportunity count. These come from `adminStats()` (count queries; the admin read-all RLS policies make per-user counts possible).
- **A couple of small charts (grayscale, optional-but-recommended):** e.g., enrollments per course (bar) and opportunities by direction (bar/pie), to make "this scales" tangible. Charts use a grayscale palette to respect the monochrome system; no brand accent.
- **Recent activity / quick links:** a compact list of the most recently added opportunities and courses, with a "Create new" CTA into each manager. This is the on-ramp for the demo's "add a new olympiad" beat.

The dashboard's job is narrative as much as functional: a judge glancing at it should immediately read "an organization could run on this."

---

## 5. Opportunities management — concrete

- **List:** a data table of all opportunities (admin sees published + drafts). Columns: title (active locale), type, format, grade range, deadline, published status (a monochrome Draft/Published badge), and an actions menu (Edit · Publish/Unpublish · Delete). A search box and the same facet filters as the public catalog help find items at scale. "New opportunity" button top-right.
- **Create / edit form** (a slide-over drawer or dedicated form — drawer recommended for opportunities): all fields, with **trilingual editing** handled by a tabbed control per translatable field — EN / RU / KK tabs on each of title, summary, description, requirements — so the admin fills all three languages without leaving the field. Non-translatable controls: type and format (selects from the enums), grade min/max, deadline (date picker), organizer, location, apply URL, featured toggle, and a **publish toggle**. **Tags** are a multi-select sourced from the tags dictionary (chips grouped by direction/subject), so admins pick from the controlled vocabulary that powers filters and recommendations — never free text.
- **Delete:** a confirm dialog (notes that saves referencing it will be removed via cascade).
- **Live effect:** creating + publishing + tagging an opportunity makes it appear immediately in the public catalog and, because recommendations read published opportunities by tag overlap, in matching students' recommendation rails. This is the closing demo beat.

---

## 6. Courses management — concrete

- **List:** a table of courses (published + drafts) with title, subject, difficulty, lesson count, published status, and actions (Edit · Publish/Unpublish · Delete). "New course" button.
- **Course editor** (a dedicated page, because it's heavier): two regions.
  - **Course meta:** trilingual title/summary/description (the same EN/RU/KK tabbed fields), subject, difficulty (select), estimated hours, cover URL, tags (multi-select from the dictionary), and a publish toggle.
  - **Lessons:** an ordered, reorderable list of the course's lessons. Each lesson row shows position, title, content type, and whether it has a quiz, with Edit / Delete and drag-or-button reordering (reorder writes the `position` values). "Add lesson" appends a new one.
- **Lesson editor** (drawer or sub-page): trilingual title and body, content type (video/text), video URL (with the placeholder behavior from Phase 3), a repeatable **materials** list (each material = trilingual label + URL), and duration.
- **Quiz editor** (within the lesson editor): a passing-score field and a repeatable **questions** builder — each question has a trilingual prompt, a repeatable list of options (each option = trilingual label), and a **"correct" selector** marking the right option. Saving writes the questions as the embedded JSONB the `grade_quiz` RPC already consumes; correct answers stay server-side and never reach learners.

The concrete win here: an admin can stand up an entire new course — meta, lessons, materials, and quizzes, in three languages — and publish it, and it's immediately learnable end-to-end by students, with progress and certificates working, no code changes.

---

## 7. Users management — concrete

- **List:** a read-only table of profiles — name, email, role, grade, onboarded status, and join date — with search and a role filter. This demonstrates the user base at a glance (Impact).
- **Optional role management:** an admin can change a user's role (student / mentor / admin) via a guarded control with a confirm dialog, and the UI prevents an admin from demoting themselves (so no one can lock the team out). This is optional for the MVP; the read-only list is the baseline.

---

## 8. States — loading, empty, validation, confirm, error

- **Loading:** table and stat skeletons.
- **Empty:** with seeded data nothing is empty; new-install empty states still read intentionally ("No opportunities yet — create your first").
- **Form validation:** required fields (e.g., at least the RU + EN title, a type, a format) are enforced with inline messages; an unsaved-changes guard prevents accidental loss on the heavier course editor.
- **Confirm:** destructive actions (delete, role change, unpublish) use confirm dialogs.
- **Save feedback:** success and error toasts; lists revalidate so changes appear live without a manual refresh.

---

## 9. Visual & interaction spec

- **Monochrome, table-first.** The admin area is strictly monochrome — Draft/Published badges, status, and charts all in grayscale; **no brand accent** (admin has no progress/success semantics). Clean tables, hairline borders, generous spacing, Geist throughout.
- **Trilingual editing as tabs.** The EN/RU/KK tabbed field is the signature admin interaction — compact, obvious, and the thing that makes "scalable + multilingual" real rather than claimed.
- **Motion (minimal):** drawer slide-ins; row update transitions; nothing decorative.
- **Responsive:** tables become horizontally scrollable / card-style on small screens; the course editor remains usable on a laptop (admin work is desktop-first, but it must not break on tablet).
- **Accessibility:** tables have proper headers and row actions reachable by keyboard; forms have labeled fields and grouped fieldsets; the correct-option selector is a labeled radio group; confirm dialogs trap focus.

---

## 10. Data, services & contract (no code)

- **Implements the stubbed admin methods** and adds the few the editors need: `adminUpsertOpportunity`, `adminDeleteOpportunity`, `adminTogglePublish(kind,id)`, `adminUpsertCourse`, `adminUpsertLesson`, `adminDeleteLesson`, `adminReorderLessons`, `adminUpsertQuiz`, `adminDeleteCourse`, `adminListUsers`, `adminUpdateRole` (optional), and `adminStats`.
- **Permissions:** these run as **server actions with the admin's session**; the Phase 1 `is_admin()` RLS policies authorize the writes. No service/secret key is used in the running app — that key is only for the offline seed script.
- **Reads:** admins use the same provider reads, which include unpublished content for admins via the existing RLS branch. `adminStats` is a set of count queries.
- The provider indirection holds — admin UIs call server actions that call the provider; no direct Supabase calls in components.

---

## 11. Internationalization

- Admin UI chrome (nav, table headers, form labels, dialogs, toasts) comes from a new `admin` message namespace in `messages/{ru,en,kk}.json`. The admin team may work primarily in one language, but the chrome is localized for consistency. The **content being edited** is inherently trilingual via the EN/RU/KK tabbed fields — that's the point of the JSONB model from Phase 1.

---

## 12. Build prompts (architecture-level requests + acceptance)

**BP6-1 — Admin shell + dashboard + stats.** Build the `(admin)` layout with `requireAdmin()` gating, the admin nav, the "Back to student view" link, and the dashboard with the stat strip (via `adminStats`) and the grayscale charts (§3–§4). *Acceptance:* non-admins are redirected; admins see accurate counts and recent items; "Back to student view" works for the demo switch.

**BP6-2 — Opportunities CRUD.** Build the list table (with publish badges, search, filters), the create/edit form with EN/RU/KK tabbed fields, dictionary-sourced tag multi-select, enum selects, deadline picker, featured + publish toggles, and delete-with-confirm (§5); implement `adminUpsertOpportunity`, `adminDeleteOpportunity`, `adminTogglePublish`. *Acceptance:* an admin can create, edit, publish/unpublish, and delete an opportunity in three languages; a newly published, tagged opportunity appears in the public catalog and in matching students' recommendations without a redeploy.

**BP6-3 — Courses CRUD (meta).** Build the courses list and the course-editor meta region with trilingual fields, subject/difficulty, tags, and publish toggle (§6); implement `adminUpsertCourse`, `adminDeleteCourse`, course publish toggle. *Acceptance:* an admin can create/edit/publish/delete a course; published courses appear in the public catalog.

**BP6-4 — Lesson & quiz editor.** Build the reorderable lesson list and the lesson editor (trilingual title/body, content type, video URL, repeatable materials, duration) plus the embedded quiz builder (passing score; repeatable trilingual questions/options with a correct selector) (§6); implement `adminUpsertLesson`, `adminDeleteLesson`, `adminReorderLessons`, `adminUpsertQuiz`. *Acceptance:* an admin can build a full multilingual course with lessons, materials, and quizzes; students can then learn it end-to-end with working progress, grading, and certificate; correct answers never reach the client.

**BP6-5 — Users list (+ optional roles).** Build the users table with search/role filter, and optionally the guarded role-change control (§7); implement `adminListUsers` (+ `adminUpdateRole` if included). *Acceptance:* the table lists all profiles with role/grade/onboarded/join date; if role management is included, role changes persist and an admin cannot demote themselves.

**BP6-6 — i18n, a11y, and the live-recommendation verification.** Add the `admin` namespace in all locales; apply the accessibility spec; and verify the closing demo loop end-to-end (§4–§5, §9, §11). *Acceptance:* admin chrome works in RU/EN/KK; tables/forms/dialogs pass keyboard + screen-reader checks; and the scripted demo — admin publishes a tagged olympiad, then "Back to student view" shows it in a matching student's recommendations — works reliably.

---

## 13. Definition of Done for Phase 6

- The `(admin)` area is role-gated; only admins reach it, and "Back to student view" enables the demo switch.
- The admin dashboard shows accurate stats (users, published opportunities/courses, enrollments, completions, saves) and grayscale charts.
- Opportunities have full CRUD with trilingual editing, dictionary-based tags, enum facets, and publish/unpublish — and changes are live in the public catalog and recommendations.
- Courses have full CRUD including a reorderable lesson editor and an embedded quiz builder; an admin-built course is immediately learnable with working progress, grading, and certificate; correct answers stay server-side.
- A users list shows the base; optional role management is guarded against self-lockout.
- All admin surfaces are strictly monochrome, table-first, localized in RU/EN/KK, responsive, and accessible; admin writes run on the admin's session via RLS (no service key in the app).
- **Demo loop closed:** publish a new olympiad → it appears in a matching student's recommendations live.

---

## 14. What Phase 7 will cover (preview)

**Phase 7 — Polish & Demo-Readiness (the final phase):** the real, high-design **landing page** (value prop, the three CTAs from the brief, the monochrome Vercel-native aesthetic at full strength); a sweep of every empty / loading / error state for consistency; the responsive and accessibility pass across all phases; restrained motion finishing; **seeding the exact demo accounts and data** so the four-minute thread runs flawlessly (a primed student profile, a saved hackathon, a course mid-progress, an admin account, a ready-to-publish olympiad); a smoke-test of the full demo spine; and **Vercel deploy hardening** (env vars, OAuth redirect URLs for the production domain, error boundaries, metadata/SEO). After Phase 7 the MVP is submission-ready against all five rubric criteria.
