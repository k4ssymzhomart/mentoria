# Mentoria Hub — Phase 4: Personalization (Onboarding · Recommendations · Dashboard · Calendar · Roadmap)

> **Format:** architecture and the concrete final result only — no code. Defines screens, regions, components, data flows, states, and finished behavior. Your coding agent implements against it.

**Goal of Phase 4:** turn two separate engines into one personalized hub. A new student is onboarded (grade, interests, subjects, goals), the platform immediately recommends relevant opportunities and courses, and a single **dashboard** shows their saved opportunities, courses-in-progress, upcoming deadlines, recommendations, and certificates together. A **deadline calendar** and a **grades 9–12 roadmap builder** complete the personalization layer. This closes the full demo spine: *"she onboards → a personalized dashboard materializes → she saves a hackathon → completes a lesson and quiz → progress and deadlines update on one screen."*

**Where it sits:** Engine 3 (Personalization), the connective tissue between Discovery and Learning. It consumes the Phase 1 `recommend_opportunities` / `recommend_courses` RPCs and the `getRoadmap` / `upsertRoadmapItem` / `deleteRoadmapItem` provider methods, plus reads from `listSaved`, `listEnrollments`, `getCourseProgress`, and `listCertificates`. One small addition to the data contract: a `updateProfile` (a.k.a. `completeOnboarding`) action to persist grade/interests/subjects/goals and flip `onboarded`.

---

## 1. Scope

**In scope:** the onboarding wizard and the onboarding gate; the deterministic recommendation rails (opportunities + courses) with a plain-language "why"; the student dashboard; the deadline calendar; the roadmap builder including a "generate starter roadmap" action; and the first-run empty states that make a brand-new account feel alive.

**Out of scope (later):** the conversational AI study/opportunity assistant that builds on these recommendations (Phase 5); admin content management and analytics (Phase 6). Phase 4 uses the deterministic tag-overlap recommendations from Phase 1 — the AI layer in Phase 5 augments, never replaces, them.

---

## 2. Routes & access (all inside the `(app)` auth group)

- `/[locale]/onboarding` — the wizard. Auth required; minimal chrome (not the full app shell).
- `/[locale]/dashboard` — the hub home (the default landing after sign-in once onboarded).
- `/[locale]/calendar` — the deadline calendar.
- `/[locale]/roadmap` — the roadmap builder.

**The onboarding gate:** the `(app)` layout checks the profile — if `onboarded` is false and the user isn't already on `/onboarding`, redirect them to the wizard. The wizard itself is exempt from the gate. After completion, redirect to `/dashboard`.

---

## 3. The onboarding wizard — concrete final flow

A focused, full-screen, multi-step experience with a slim step indicator (e.g., "Step 2 of 4"), generous whitespace, monochrome, large tap targets, and Back / Next. Options are drawn from the **tags dictionary** so they're already localized and stay in sync with the catalog.

- **Step 1 — Grade.** Four large selectable cards: 8, 9, 10, 11. Single-select, required.
- **Step 2 — Interests (directions).** Multi-select chips from the `direction` tags (STEM, Programming, Science, Business, Finance, Social Impact, Humanities, Arts). At least one required; the chips fill solid monochrome when selected.
- **Step 3 — Subjects.** Multi-select chips from the `subject` tags (Math, Physics, Biology, Chemistry, CS, Economics, English, SAT, IELTS, Admissions). Optional but encouraged.
- **Step 4 — Goals.** Multi-select from a localized goal set ("Get into a top university", "Win an olympiad", "Improve SAT/IELTS", "Find scholarships", "Build a research or startup project", "Volunteer / social impact"). Stored as goal strings on the profile.
- **Finish.** A brief "Building your hub…" transition, then the profile is saved (grade, interests, subjects, goals, `onboarded = true`) and the user lands on a dashboard already populated with recommendations.

A subtle **"Skip for now"** is available; skipping sets `onboarded = true` with whatever was chosen (possibly empty). The UI gently notes that recommendations get sharper with at least a couple of interests selected — but the student is never trapped.

---

## 4. The recommendation model — concrete behavior

- **The interest vector** is the union of the profile's `interests` (direction slugs) and `subjects` (subject slugs) — both are slugs from the same dictionary, which is exactly why Phase 1 modeled them as arrays. Grade is passed alongside for opportunities.
- **Opportunities** come from `recommend_opportunities(interestVector, grade)`: published, grade-appropriate, ranked by number of overlapping tags, then soonest deadline.
- **Courses** come from `recommend_courses(interestVector)`: ranked by tag overlap.
- **The "why" (plain language, no AI yet):** each recommended item shows a short rationale derived from the overlapping tags — e.g., "Because you're interested in STEM and Math" / «Потому что вам интересны STEM и математика». This is computed from the intersection of the item's tags and the interest vector. It makes the personalization legible and previews the conversational explanation the AI assistant will give in Phase 5.
- **Graceful fallback:** if the interest vector is empty (a skipped onboarding), rails fall back to newest opportunities / featured courses so the dashboard is never blank.

---

## 5. The dashboard — the keystone screen, concrete layout

The dashboard is where the product stops feeling like separate features. Inside the app shell, top to bottom:

- **Greeting + stat strip.** "Welcome back, {first name}" and a compact, monochrome stat strip of derivable counts: courses in progress, lessons completed, certificates earned, opportunities saved. (A simple activity streak is an optional add derived from lesson-completion dates; counts are the required baseline so no new schema is needed.)
- **Continue learning.** A rail of enrolled courses, each with its **accent progress bar** and a "Continue" button to the next incomplete lesson. Empty state for a fresh account: a single nudge card → "Browse courses."
- **Upcoming deadlines.** A compact list of the student's saved/applied opportunities sorted by nearest deadline, each showing days-left (monochrome, bolder when imminent) and linking to the detail; a "View calendar →" link. Empty state → "Save opportunities to track their deadlines."
- **Recommended for you.** Two sub-sections — opportunities and courses — each a small set of cards (reusing the Phase 2/3 cards) carrying the plain-language "why." This is the rail where, in the demo, an admin-added olympiad later appears (Phase 6 closes that loop).
- **Saved opportunities.** A compact view of saved items with a Saved / Applied split, and a link to the full saved list. Reuses the opportunity card with its saved/applied state.
- **Your certificates.** A wall of earned certificates (if any), each linking to its certificate view. Hidden when empty.
- **Quick links** to Calendar and Roadmap.

**First-run dashboard (immediately after onboarding):** nothing is saved or enrolled yet, so the screen leads with **Recommended for you** front and center plus clear CTAs ("Browse opportunities", "Start a course"). This state is a required deliverable — it's the exact moment the demo shows "the personalized hub materializes," so it must feel intentional and full, never empty.

---

## 6. The deadline calendar — concrete behavior

- **Default (desktop):** a month grid. Days that carry a saved/applied opportunity deadline show a small monochrome marker with a count; "today" is highlighted in monochrome. Clicking a day reveals the opportunities due that day (title, type, link to detail). Prev/Next month navigation.
- **Agenda toggle / mobile default:** a chronological list of upcoming deadlines grouped by date — clearer on small screens and faster to scan.
- **Source:** the student's saved + applied opportunities (their personal commitments), not the entire catalog. Empty state → "Save opportunities and their deadlines show up here."
- **Palette:** the calendar is about urgency, not achievement, so it stays **strictly monochrome** (markers, today-highlight, imminent-deadline emphasis via weight) — consistent with the deadline treatment in Discovery. No brand accent here.

---

## 7. The roadmap builder — concrete behavior

The most mentorship-flavored feature: a multi-year plan across grades 9–12.

- **Layout:** four lanes — Grade 9, 10, 11, 12 — each holding roadmap items as cards. Each card shows a title, a type tag (Course / Opportunity / Milestone), and a status (To do / In progress / Done). A lane header shows that grade's progress ("2/5 done") with an **accent mini-bar**; **Done** items get an **accent check** (status = success, so accent is appropriate).
- **Adding items:** "Add to roadmap" lets the student pick a **course** or **opportunity** from the catalog (searchable), or create a **custom milestone** with free text (stored in the current locale; custom text isn't auto-translated, which is acceptable). Items are assigned to a grade.
- **Organizing:** drag-and-drop to reorder within a lane and move between grades is the target interaction, with a non-DnD fallback (move up/down + "change grade" control) so it's robust on touch and for the demo. Status is changed via a quick control on each card.
- **Generate a starter roadmap (signature touch):** a one-tap action that auto-populates a sensible plan from the student's profile — it spreads recommended courses and opportunities across the remaining grades using a simple heuristic (e.g., language/SAT/IELTS and foundational courses earlier; competitions and research mid-track; applications, scholarships, and admissions work in grade 11). It persists as roadmap items the student can then edit. This is what makes the roadmap feel like a mentor handed them a plan, and it directly reuses the recommendation engine.
- **Persistence:** every change writes through `getRoadmap` / `upsertRoadmapItem` / `deleteRoadmapItem`. Empty state → "Generate a starter roadmap" plus "Add manually."

---

## 8. States — loading, empty, first-run, error

- **Onboarding:** per-step validation (grade required, ≥1 interest to advance past Step 2), a save/loading state on finish.
- **Dashboard:** the **first-run** state (recommendations-forward, CTA-rich) and the **returning** state (full of the student's real data); skeletons for each rail while data loads.
- **Calendar / Roadmap empty states:** each with a constructive CTA (save opportunities / generate a roadmap).
- **Errors:** profile save, recommendation fetch, and roadmap mutations fail gracefully with retry; if recommendations error, rails fall back to newest/featured so the dashboard never collapses.

---

## 9. Visual & interaction spec

- **Accent discipline (consistent with prior phases):** the brand accent appears only where there's progress or success — Continue-learning progress bars, roadmap lane progress + Done checks, and the certificates wall (the seal). Everything else — stats, deadlines, calendar, recommendation "why" chips, onboarding chips — stays monochrome. Deadlines and the calendar never use the accent.
- **Type & shape:** Geist; hairline borders; minimal radius; whitespace-led; the dashboard reads as a calm, scannable command center, not a noisy widget wall.
- **Motion (restrained):** onboarding step transitions; the "Building your hub…" beat; progress bars animating into place on the dashboard; roadmap drag feedback. Nothing flashy.
- **Responsive:** onboarding is single-column and thumb-friendly; the dashboard rails reflow to stacked sections on mobile; calendar defaults to agenda on mobile; roadmap lanes become horizontally scrollable or stack with a grade switcher on mobile.
- **Accessibility:** the onboarding wizard is fully keyboard navigable with clear focus and selection states; progress and status are conveyed by text + glyph, not color alone; the calendar grid and roadmap controls are operable without a mouse; drag-and-drop has the keyboard/button fallback.

---

## 10. Data & mutations (contract, no code)

- **New to the contract:** `updateProfile(userId, { grade, interests, subjects, goals, onboarded })` — a server action used by the wizard. (The roadmap methods already exist in the Phase 1 interface.)
- **Reads (Server Components):** the dashboard composes `listEnrollments` (+ per-course progress), `listSaved`, `listCertificates`, and the two `recommend_*` RPCs (fed the interest vector + grade); upcoming-deadlines is derived from saved/applied items; the calendar reads saved/applied opportunities; the roadmap reads `getRoadmap`.
- **Mutations** are thin server actions over the provider — `updateProfile`, `upsertRoadmapItem`, `deleteRoadmapItem` — revalidating the relevant paths. "Generate starter roadmap" runs the recommendation RPCs, maps results to grades via the heuristic, and persists them through `upsertRoadmapItem`. Clients never touch Supabase directly.

---

## 11. Internationalization & formatting

- **Chrome** for onboarding, dashboard, calendar, and roadmap comes from four new message namespaces in `messages/{ru,en,kk}.json`; the goals option set and the recommendation "why" template live there too (the "why" interpolates localized tag labels from the dictionary).
- **Content** (recommended items, saved items, course/opportunity titles) reads from row JSONB in the active locale with English fallback; tag labels come from the dictionary.
- **Dates, days-left, percentages, and the calendar** are locale-aware. Switching language preserves dashboard/calendar/roadmap state. Custom roadmap milestones display in whatever language they were entered.

---

## 12. Build prompts (architecture-level requests + acceptance)

**BP4-1 — Onboarding wizard + gate + profile save.** Build the 4-step wizard (§3) sourcing options from the tags dictionary, the `updateProfile` action, and the `(app)`-layout onboarding gate. *Acceptance:* a fresh signed-in account is redirected to onboarding; completing it persists grade/interests/subjects/goals, flips `onboarded`, and lands on a populated dashboard; "Skip" works without trapping the user.

**BP4-2 — Recommendation rails + "why."** Wire the interest vector (interests ∪ subjects) + grade into `recommend_opportunities` / `recommend_courses`, render recommended opportunity/course rails reusing existing cards, and compute the plain-language "why" from overlapping tags, with the empty-vector fallback (§4). *Acceptance:* recommendations rank by tag overlap; each card shows a correct localized rationale; a skipped-onboarding user still sees newest/featured fallbacks.

**BP4-3 — Dashboard.** Build the dashboard (§5) with all sections, the first-run state, and per-rail skeletons. *Acceptance:* a returning student sees real continue-learning progress, upcoming deadlines, saved items, recommendations, and certificates on one screen; a just-onboarded student sees the recommendation-forward first-run state, never an empty page.

**BP4-4 — Deadline calendar.** Build the month grid + agenda toggle over saved/applied deadlines (§6), monochrome. *Acceptance:* saved opportunities' deadlines appear on the correct days; clicking a day lists them; mobile defaults to agenda; empty state nudges saving.

**BP4-5 — Roadmap builder + generate-starter.** Build the 9–12 lanes, add/move/status controls with the DnD-plus-fallback, and the "Generate a starter roadmap" action driven by recommendations (§7). *Acceptance:* items can be added (course/opportunity/milestone), assigned to grades, reordered, and marked done (accent check); generate-starter produces a sensible editable plan; all changes persist.

**BP4-6 — i18n, accent, motion, responsive, a11y.** Add the four message namespaces in all locales; apply the accent-only-for-progress/success rule, restrained motion, responsive behavior, and accessibility spec (§9, §11). *Acceptance:* RU/EN/KK translate all chrome and reformat dates/percentages while preserving state; accent appears only on progress/success surfaces; keyboard and screen-reader pass across the wizard, dashboard, calendar, and roadmap.

---

## 13. Definition of Done for Phase 4

- A new account is gated into onboarding, completes it, and lands on a populated dashboard; the profile stores grade/interests/subjects/goals and `onboarded`.
- Recommendations (opportunities + courses) rank by tag overlap, carry a localized "why," and fall back gracefully when the interest vector is empty.
- The dashboard shows continue-learning (with accent progress), upcoming deadlines, saved/applied items, recommendations, and certificates on one screen, with a deliberate first-run state.
- The calendar surfaces saved/applied deadlines (month + agenda), strictly monochrome.
- The roadmap builder supports add/move/status across grades 9–12 with a generate-starter action; changes persist; Done items and lane progress use the accent.
- Everything works in RU/EN/KK, is fully responsive and accessible, and the accent appears only on progress/success surfaces.
- **Demo spine closed:** onboarding → recommendations → save → learn → progress, deadlines, and certificate all visible on the dashboard in one continuous thread.

---

## 14. What Phase 5 will cover (preview)

**Phase 5 — AI Layer (assistant + explained recommendations):** a conversational study/opportunity assistant, called through a protected server route, that answers free-form questions ("what biology olympiads fit a grade-10 student aiming for med school?"), explains *why* items are recommended in natural language, and can suggest roadmap additions — always grounded in the real catalog and the student's profile, and **degrading gracefully** to the deterministic Phase 4 recommendations if the AI call fails, so the demo can never break on an API hiccup. This is the Innovation-criterion flagship, layered on top of a system that already works completely without it.
