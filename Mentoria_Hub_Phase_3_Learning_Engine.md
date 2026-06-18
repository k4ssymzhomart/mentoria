# Mentoria Hub — Phase 3: Learning Engine (Courses)

> **Format:** architecture and the concrete final result only — no code. Defines screens, regions, components, data flows, states, and finished behavior. Your coding agent implements against it.
>
> **Video decision (locked):** lessons use a placeholder embed by default; the player is built to swap in real video URLs per lesson with zero structural change. Lessons gracefully fall back to text + materials when a lesson has no video.

**Goal of Phase 3:** the asynchronous learning experience — a student discovers a course, enrolls, works through lessons (video placeholder + text + materials), passes in-lesson quizzes graded server-side, watches a live progress bar fill, completes the course, and earns a certificate. This delivers the brief's second core function (async courses) and the second half of the demo spine: *"she opens a recommended course, completes a lesson and its quiz, her progress advances, and she earns a certificate."*

**Where it sits:** Engine 2 (Learning). Reads/writes entirely through the Phase 1 `db` provider: `listCourses`, `getCourseBySlug`, `getLessonForLearner`, `enroll`, `listEnrollments`, `getCourseProgress`, `completeLesson`, `gradeQuiz`, `issueCertificate`, `listCertificates`. No new database work — the schema, RLS, and the `grade_quiz` / `issue_certificate` RPCs already exist.

---

## 1. Scope

**In scope:** courses catalog, course detail (lesson list + progress + enroll), the lesson player (video/text/materials + lesson navigation), the in-lesson quiz with server-side grading and pass/fail, lesson completion, live progress tracking, course completion, and the certificate (view + print). Plus visitor-vs-student gating and the locked-lesson preview.

**Out of scope (later):** the "Continue learning" rail and certificates wall on the dashboard (Phase 4), course recommendations surfaced on the dashboard (Phase 4), the AI study assistant (Phase 5), and admin course/lesson authoring (Phase 6). Phase 3 consumes the three seeded courses; it does not create content.

---

## 2. Routes & access

- `/[locale]/courses` — catalog. **Public** (preview/browse).
- `/[locale]/courses/[slug]` — course detail. **Public** (preview): visitors see the full outline, but lessons are locked.
- `/[locale]/courses/[slug]/lessons/[lessonId]` — the lesson player. **Auth + enrollment required.** A signed-in user who isn't enrolled is auto-enrolled on entry (or prompted, see §8); a visitor gets the sign-in dialog.
- `/[locale]/certificates/[serial]` — certificate view (owner; optional public share, see §10).

Catalog and detail live outside the `(app)` auth group; the lesson player and certificate view live inside it (Phase 0 guards apply).

---

## 3. The courses catalog — concrete final layout

Inside the standard app shell, a single column with a header and a card grid:

- **Header:** title ("Courses" / «Курсы» / «Курстар»), a one-line value subtitle ("Learn at your own pace — no live sessions required"), and a light filter row (subject and difficulty). With only three seeded courses the filter is nearly cosmetic, but it's built to scale and demonstrates the same URL-driven pattern as Discovery (params: `subject`, `difficulty`).
- **Grid:** course cards, 3-up on desktop / 2 tablet / 1 mobile.

**Course card (concrete):** a bordered card with a cover area at top (a clean monochrome cover or a subtle geometric placeholder if `cover_url` is empty), then a difficulty badge (outlined, monochrome — "Beginner/Intermediate/Advanced", localized), the title (Geist semibold), the one-line summary (muted), and a meta footer: lesson count and estimated hours, plus the subject/direction tag chips. 
- *If the viewer is a signed-in, enrolled student:* the footer also shows a thin **progress bar (brand accent)** and the primary button reads **"Continue"** (jumps to the next incomplete lesson). A 100%-complete course shows a small **"Completed" badge with an accent check** and a "Review / Certificate" action.
- *Otherwise:* the primary button reads **"Start course"** (visitor → sign-in; signed-in non-enrolled → enroll then go to lesson 1) and there's no progress bar.

---

## 4. The course detail page — concrete final layout

A centered content column:

- **Header block:** course title (large Geist), summary, then a meta line — difficulty · lesson count · estimated hours · subject/direction tags. 
- **Enrollment / progress panel:** for a visitor or non-enrolled student, a prominent **"Start course"** CTA (monochrome primary) with a one-line "Free · self-paced" note. For an enrolled student, this panel becomes a **progress summary**: an accent progress bar with "X of Y lessons · NN%" and a **"Continue"** button to the next incomplete lesson. For a completed student, a **"Course completed"** state with an accent check and **"View certificate"**.
- **Description** section (the long `description`).
- **Lesson list (`LessonList`):** the course outline as an ordered list. Each row shows the lesson number, title, duration, a content-type hint (video/text), and a **status indicator**:
  - locked (visitor / non-enrolled) — a lock glyph; the row is non-navigable and clicking it triggers the enroll/sign-in path;
  - not started (enrolled) — an empty circle;
  - completed — an **accent check**.
  The current/next lesson is subtly emphasized. Clicking an unlocked row opens the player.

---

## 5. The lesson player — concrete final layout

This is the core learning surface. Desktop is a two-region layout:

- **Main column (left, fluid):**
  1. A breadcrumb/back ("← Course title") and the lesson title.
  2. **Media:** if the lesson is a video lesson, a responsive 16:9 embed (placeholder by default; real URL when provided). If it's a text lesson, this region is the formatted **lesson body** rendered from the locale's JSONB (headings, paragraphs, lists). Video lessons show the body *below* the video.
  3. **Materials:** a small "Materials" block listing downloadable resources (label + link), shown when the lesson has any.
  4. **Quiz** (if the lesson has one): see §6.
  5. **Footer controls:** "Previous" and the primary action — **"Mark complete & continue"** for lessons without a quiz, or the quiz gates completion for lessons with one (see §6). The last lesson's action reads **"Finish course."**
- **Sidebar (right, ~300px, sticky) — `CourseProgressRail`:** the course title, an **accent progress bar** with "NN%", and the full lesson list with **accent checks** on completed lessons and the current lesson highlighted. Each entry is a jump link. This is the student's sense of place and momentum.

Mobile: the sidebar collapses into a "Lessons" drawer reachable from a top bar that always shows the mini progress bar; the main column stacks; the video stays 16:9; quiz options stack full-width; the footer action is a sticky bottom bar.

---

## 6. The quiz — concrete behavior and grading

- **What renders:** the quiz title (if any) and each question with its options as single-select controls. **Correct answers are never present in the client payload** — `getLessonForLearner` strips them; the page only has prompts and options.
- **Submitting:** the student answers and presses "Check answers." The answers go to the `grade_quiz` server action/RPC, which computes the score server-side, records an attempt, and returns score + pass/fail.
- **Result (concrete):** a result banner appears — on **pass** (score ≥ the quiz's passing score), an **accent success banner** ("Passed — 100%"); on **fail**, a neutral monochrome banner ("Not yet — 50%. Review and try again.") with a **"Try again"** that resets the form. Attempts are unlimited.
- **Completion rule:** a lesson that **has** a quiz is marked complete **only when the quiz is passed** — passing auto-calls `completeLesson`, ticks the accent check in the sidebar, advances the progress bar, and enables "continue." A lesson **without** a quiz is completed by the explicit "Mark complete & continue" button. This makes quizzes meaningful and ties them directly to the progress loop.
- *(Optional enhancement, flagged not required: per-question right/wrong feedback would need the grading RPC to return per-question results; the MVP shows aggregate score + pass/fail only.)*

---

## 7. Progress, completion, and the certificate

- **Progress** is `completed lessons ÷ total lessons`, surfaced as an accent bar on the course card, the course detail panel, and the lesson sidebar. It updates the instant a lesson is completed.
- **Course completion:** when the final lesson is completed and progress reaches 100%, the player shows a **completion celebration** (a restrained accent moment — a check, a short congratulations, gentle motion) and triggers certificate issuance via the `issue_certificate` RPC (which re-verifies on the server that every lesson is done, so it can't be forged; it's idempotent, so re-completing won't duplicate).
- **The certificate (concrete artifact):** a designed monochrome card with the single **accent seal/accent rule** as its only color. Contents: a "Certificate of Completion" line, the **student's full name** (from their profile), the **course title** (localized), the **serial** (e.g., `MH-2026-AB12CD`), the **issue date** (localized), and the **Mentoria wordmark/seal**. It's reachable from the completion celebration, the course detail ("View certificate"), and later the dashboard.
- **Print/share:** the certificate view has a **"Print / Save as PDF"** action using a print-optimized layout (clean, full-bleed, no app chrome). A public share link at `/certificates/[serial]` is an **optional** nice-to-have; if included it needs a small public read path by serial (the default RLS keeps certificates owner-only), so unless you want public sharing, the certificate stays owner-viewable + printable.

---

## 8. Enrollment & gating — concrete flows

- **Visitor** on catalog/detail: full preview; lessons locked. "Start course" or a locked lesson opens the **sign-in dialog**; after sign-in they're enrolled and dropped into lesson 1 (intent preserved).
- **Signed-in, not enrolled:** "Start course" calls `enroll` (idempotent) and navigates to lesson 1. Entering a lesson URL directly while signed-in but not enrolled auto-enrolls (frictionless for the demo) — or, if you prefer an explicit step, shows a one-tap "Enroll to start" confirm. *Default: auto-enroll on entry* for demo smoothness.
- **Enrolled student:** "Continue" everywhere resumes at the first incomplete lesson; completed lessons remain replayable.
- **Course detail and catalog stay public** so the catalog is shareable and the product never feels walled to a curious visitor.

---

## 9. States — loading, locked, empty, error

- **Loading:** skeletons for the catalog grid, the course detail outline, and the lesson player (media block + sidebar shimmer) during navigation.
- **Locked:** the preview state — visible lesson titles with lock glyphs and a clear enroll/sign-in path.
- **Quiz states:** unanswered → answered-but-unsubmitted → submitted-pass (accent) / submitted-fail (neutral, retry).
- **Empty:** with three seeded courses the catalog is always populated; if a course had zero lessons the detail page shows a graceful "Content coming soon" rather than a broken outline.
- **Error:** enroll, quiz-submit, and certificate-issue failures show calm inline errors with a retry, never a crash; the certificate celebration tolerates a transient RPC failure (it can re-issue on next visit since it's idempotent).

---

## 10. Visual & interaction spec (the accent enters here)

- **Accent discipline:** the brand accent appears **only** as progress-bar fill, completed-lesson checks, the quiz pass banner, the completion celebration, and the certificate seal. Everything else — buttons, badges, borders, text — stays strictly monochrome. CTAs ("Start course", "Continue", "Mark complete", "Finish course") are monochrome primary buttons; success is what wears the color. This deliberate contrast with the all-monochrome Discovery phase makes "you're making progress" feel earned.
- **Type & shape:** Geist; hairline borders; minimal radius; whitespace-led; flat surfaces. Lesson body uses a clean reading measure and clear heading hierarchy.
- **Motion (restrained):** progress bar fills with a smooth transition when a lesson completes; the accent check ticks in; the completion celebration is a brief, dignified accent moment (no confetti storm); page/lesson transitions cross-fade.
- **Responsive:** sidebar → drawer; sticky mini-progress bar and sticky footer action on mobile; 16:9 media at every width.
- **Accessibility:** quiz options are proper radio groups with labels and keyboard support; progress is announced (aria) not color-only (the "NN%" text carries the meaning); completed state has a non-color cue (the check glyph + label); video embeds have titles; visible focus throughout.

---

## 11. Data & mutations (contract, no code)

- **Reads** (Server Components): catalog calls `listCourses` (+ `listEnrollments` when signed in, to show progress/Continue on cards); detail calls `getCourseBySlug` (+ `getCourseProgress` when enrolled); the player calls `getLessonForLearner` (quiz answers already stripped) and `getCourseProgress`.
- **Mutations** are thin **server actions** over the provider: `enroll`, `completeLesson`, `gradeQuiz`, and `issueCertificate`, each re-validating the relevant paths so server-rendered progress stays correct. Clients never touch Supabase directly. "Continue / next incomplete lesson" is computed from the lesson order vs. the set of completed lessons.

---

## 12. Internationalization & formatting

- **Chrome** (catalog/detail/player/quiz/certificate labels, buttons, banners, empty states) comes from new `courses`, `lesson`, `quiz`, and `certificate` message namespaces in `messages/{ru,en,kk}.json`.
- **Content** (course + lesson titles/bodies, quiz prompts/options, materials labels) reads from row JSONB in the active locale with English fallback.
- **Durations, hours, percentages, and the certificate date** are formatted locale-aware. Switching language in the player preserves the current lesson and progress.

---

## 13. Build prompts (architecture-level requests + acceptance)

**BP3-1 — Courses catalog & cards.** Build `CoursesPage` (Server) with the light `subject`/`difficulty` URL filters and `CourseCard` per §3, including the enrolled-vs-not states (progress bar + Continue, or Start). *Acceptance:* `/courses` shows the three seeded courses; a signed-in enrolled user sees an accent progress bar and "Continue"; a visitor sees "Start course."

**BP3-2 — Course detail & enrollment.** Build `CourseDetailPage` with the enroll/progress panel and `LessonList` with locked/not-started/completed indicators (§4), plus the `enroll` server action and visitor sign-in gating (§8). *Acceptance:* visitors see locked lessons and an enroll path; signing in + starting enrolls and opens lesson 1; enrolled users see live progress and a working "Continue."

**BP3-3 — Lesson player shell.** Build the player layout (§5): media (16:9 placeholder embed / text body), materials, the sticky `CourseProgressRail` with accent checks, prev/next navigation, and the mobile drawer. *Acceptance:* lessons render media or body per type in the active locale; the sidebar reflects completion and current position; mobile drawer + sticky controls work.

**BP3-4 — Quiz & grading & lesson completion.** Build the quiz UI and the `gradeQuiz` server action with the pass/fail banners (§6); wire the completion rule (quiz pass completes the lesson; no-quiz lessons complete via the button). *Acceptance:* answers are graded server-side with no correct answers in the client payload; passing ticks the accent check and advances progress; failing offers unlimited retry.

**BP3-5 — Progress, completion & certificate.** Wire `getCourseProgress` everywhere it's surfaced; on 100% trigger the completion celebration and `issueCertificate`; build the certificate view with the accent seal and a print/PDF layout (§7). *Acceptance:* completing the final lesson issues a certificate (idempotently), shows the celebration, and the certificate is viewable and printable with the student's name, course title, serial, and localized date.

**BP3-6 — i18n, accent, motion, responsive, a11y.** Add the four message namespaces in all locales; apply the accent-only-for-progress/success rule, the restrained motion, the responsive behavior, and the accessibility spec (§10, §12). *Acceptance:* RU/EN/KK translate all chrome and reformat dates/durations while preserving lesson/progress; accent appears only on progress/success/certificate; keyboard and screen-reader pass on the player and quiz.

---

## 14. Definition of Done for Phase 3

- `/courses` lists the three seeded courses; cards show real progress + "Continue" for enrolled students and "Start course" otherwise.
- Course detail shows the outline with correct locked/started/completed states and an enroll-or-continue panel.
- The lesson player renders video (placeholder) or text + materials in RU/EN/KK, with a sticky progress rail and working navigation, fully responsive.
- Quizzes grade server-side (no answers leak to the client); passing completes the lesson and advances progress; failing allows retry.
- Progress is live and consistent across card, detail, and player; reaching 100% issues a certificate (idempotent) and shows the completion celebration.
- The certificate is viewable and printable with correct, localized details.
- The brand accent appears **only** on progress fills, completion checks, the pass banner, the celebration, and the certificate seal — nowhere else.

---

## 15. What Phase 4 will cover (preview)

**Phase 4 — Personalization (Onboarding, Recommendations, Dashboard, Calendar, Roadmap):** the onboarding flow that captures grade/interests/subjects/goals into the profile and flips `onboarded`; the deterministic recommendation rails (powered by the Phase 1 `recommend_*` RPCs) for both opportunities and courses; the **student dashboard** that finally pulls the two engines together — saved opportunities, "Continue learning" with progress, upcoming deadlines, recommended-for-you, and earned certificates; the **deadline calendar**; and the **roadmap builder** across grades 9–12. This is where the whole demo spine closes into one screen and the product stops feeling like separate features and starts feeling like one personalized hub.
