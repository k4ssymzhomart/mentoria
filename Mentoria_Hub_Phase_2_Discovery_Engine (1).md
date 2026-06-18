# Mentoria Hub — Phase 2: Discovery Engine (Opportunities)

> **Format of this document:** architecture and the concrete final result only — no code. It defines the exact screens, regions, components, data flows, states, and finished behavior. Your coding agent implements against it.

**Goal of Phase 2:** ship the first visible, end-to-end feature — the opportunities catalog. A visitor can browse, search, filter, and open any opportunity; a signed-in student can additionally save opportunities and mark them as applied. This is the first slice of the demo spine ("she saves a hackathon and a summer research program → the deadlines appear on her calendar"): the saving happens here; the calendar/dashboard surfacing lands in Phase 4.

**Where it sits:** this is Engine 1 (Discovery) from the master plan. It reads entirely through the Phase 1 `db` provider (`listOpportunities`, `getOpportunity`, `getTags`, `listSaved`, `saveOpportunity`, `unsaveOpportunity`, `setOpportunityStatus`). No new database work.

---

## 1. Scope

**In scope:** opportunities catalog page, filter rail, keyword search, sort, pagination, the opportunity card, the opportunity detail page, related-opportunities, the save/favorite interaction, the apply interaction, and visitor-vs-student gating with a sign-in prompt.

**Out of scope (later phases):** the personalized "Saved" list and recommendation rails (Phase 4 dashboard), courses (Phase 3), the AI assistant (Phase 5), admin creation of opportunities (Phase 6). Phase 2 reads the seeded catalog; it does not create content.

---

## 2. Routes & access

- `/[locale]/opportunities` — the catalog. **Public.** Visitors get the full browse/filter/search experience; only save/apply-tracking is gated.
- `/[locale]/opportunities/[id]` — the detail page. **Public.**
- Saving and "mark as applied" require a session. An anonymous user who triggers them gets the sign-in dialog (Google + magic link from Phase 0), and the action completes after they return.

Both routes live outside the `(app)` auth group, so no redirect for visitors. The header's "Sign in" remains available throughout.

---

## 3. The catalog page — concrete final layout

Desktop (≥1024px) is a two-column layout inside the standard app shell:

- **Left rail (~280px, sticky):** the filter panel. Title "Filters" with an active-filter count and a "Clear all" link when any filter is active.
- **Right column (fluid):** a header block, then the results grid, then pagination.

The header block, top to bottom: the page title ("Opportunities" / «Возможности» / «Мүмкіндіктер»), a one-line subtitle stating the value ("Every competition, scholarship, and program worth your time — in one place"), a row containing the **search bar** (left, grows) and the **sort dropdown** (right), and then a single-line **active-filters bar** of removable chips (only present when filters are applied).

The results grid: cards in a responsive grid — 3 columns on desktop, 2 on tablet, 1 on mobile — with comfortable gutters and generous whitespace consistent with the monochrome system. Below the grid, pagination (see §6).

Mobile (<1024px): the left rail collapses. The header row shows a **"Filters" button** (with the active count as a small badge) that opens the filter panel as a bottom sheet; the search bar sits full-width above it; sort moves into the sheet or a compact dropdown. Cards stack one per row.

---

## 4. Component inventory (architecture & responsibility)

| Component | Render | Responsibility | Reads / calls |
|---|---|---|---|
| `OpportunitiesPage` | Server | Parse `searchParams` → build `OpportunityFilters`; fetch results, tags, and (if signed in) the set of saved IDs; compose the layout | `db.listOpportunities`, `db.getTags`, `db.listSaved` |
| `SearchBar` | Client | Debounced keyword input; writes `?q=` to the URL | URL only |
| `FilterRail` | Client | All filter controls; each writes its param to the URL; renders active count + Clear all | `getTags` data passed in as props |
| `SortDropdown` | Client | Switches `?sort=` between "Deadline (soonest)" and "Newest" | URL only |
| `ActiveFilters` | Client | Chips for each active filter value with a remove-✕; "Clear all" | URL only |
| `ResultsGrid` | Server | Lays out cards; renders empty state when zero results | results passed in |
| `OpportunityCard` | Server (with a client `SaveButton` island) | One opportunity summary; entire card links to detail | row data + saved flag |
| `SaveButton` | Client | Optimistic bookmark toggle; opens sign-in dialog if anonymous | `saveOpportunity` / `unsaveOpportunity` actions |
| `Pagination` | Client | Page navigation via `?page=` | URL + total count |
| `FiltersSheet` | Client | Mobile wrapper that presents `FilterRail` in a sheet | — |
| `OpportunityDetail` | Server | Full opportunity view + related | `db.getOpportunity`, related query |
| `ApplyButton` | Client | Opens `apply_url` in a new tab; if signed in, marks status "applied" | `setOpportunityStatus` action |
| `SignInDialog` | Client | Shared gate (Google + magic link) reused wherever auth is required | Phase 0 auth |
| `RelatedOpportunities` | Server | 3 cards sharing tags with the current one | `db.listOpportunities` (tag filter) |

The key architectural decision: **data fetching is server-side** (the page and cards are Server Components), so first paint is fully populated and crawlable; **filter/search/sort/pagination state lives entirely in the URL**, so the controls are thin clients that only navigate, and the server re-renders results from the params.

---

## 5. The filter & search model — URL as the single source of truth

All discovery state is encoded in the query string. This makes every filtered view shareable and bookmarkable, makes the browser Back button behave correctly, and keeps the client components stateless (they read and write the URL; the server reads the URL and returns results).

**Query-parameter schema:**

| Param | Meaning | Shape | Maps to filter |
|---|---|---|---|
| `q` | keyword search | string | `search` (matches title + summary, EN & RU) |
| `type` | opportunity types | comma list (`olympiad,hackathon,…`) | `types[]` |
| `format` | format | comma list (`online,offline,hybrid`) | `formats[]` |
| `tags` | direction/subject slugs | comma list (`stem,math,…`) | `tags[]` |
| `grade` | student grade | `8`–`11` | `grade` |
| `deadline` | urgency window | `30` / `90` / `all` | `deadlineBefore` (computed date) |
| `sort` | ordering | `deadline` / `newest` | `sort` |
| `page` | page index | integer ≥ 0 | `page` |

**Behaviors:**
- Changing any filter resets `page` to 0 and re-fetches without a full reload (soft navigation, scroll preserved).
- Search is debounced (~300ms) before it touches the URL, so typing doesn't thrash the history or the server.
- Multi-select facets (type, format, tags) toggle individual values in/out of the comma list.
- "Grade" can be prefilled from the signed-in student's profile grade (a one-tap "My grade" affordance), but remains a manual filter for visitors.
- The `ActiveFilters` bar mirrors the URL exactly; removing a chip removes that value from the URL.
- "Clear all" empties every discovery param at once.

(Implementation may use the native `useSearchParams`/`router.replace`, optionally with a typed search-params helper like `nuqs` — an agent's choice; the contract is the schema above.)

---

## 6. Sorting & pagination — final behavior

- **Default sort** is "Deadline (soonest)": opportunities with the nearest deadline first, undated ones last. The alternative is "Newest" (recently added first).
- **Pagination** uses a fixed page size of 12. The finished control shows the current range and total (e.g., "1–12 of 28") with Previous/Next. A "Load more" pattern is an acceptable alternative if it feels better on mobile, but the default deliverable is numbered Prev/Next backed by `?page=`. Total count comes from the provider's `total`.

---

## 7. The opportunity card — concrete final appearance

A bordered rectangle: 1px hairline border, minimal corner radius, flat surface (no drop shadow at rest), generous internal padding. The whole card is a link to the detail page; the save button is an interactive island that doesn't trigger navigation.

Contents, top to bottom:
- **Top row:** a type badge on the left (outlined, monochrome — e.g., "Olympiad", "Hackathon", "Scholarship", localized), and the **save bookmark** on the right (outline when not saved, solid-filled in the monochrome foreground when saved — *not* the brand accent; the accent stays reserved for progress/success).
- **Title:** the opportunity name in Geist, semibold, up to two lines with ellipsis.
- **Summary:** the one-line summary in muted foreground, one line, ellipsis.
- **Footer row:** a few small direction/subject tag chips (monochrome, localized from the tags dictionary), and the **deadline** rendered as a humanized, locale-aware string — "Until Dec 1" or "12 days left" — with near-term deadlines simply marked in stronger/bold monochrome (urgency communicated by weight and wording, never by color, to keep the palette pure).

Hover/focus: the border darkens slightly and the card lifts a hair (subtle, fast). Keyboard focus shows a visible ring.

---

## 8. The detail page — concrete final layout

A single, calm, centered column (with the related grid full-width below):

- **Back link** ("← Opportunities") and, on small screens, a breadcrumb.
- **Title** (large Geist) and directly beneath it a **meta line**: type · format · grade range (e.g., "Grades 9–11") · organizer · location (if offline/hybrid) · deadline — each item plain monochrome, separated by middots.
- **Tag chips** for directions/subjects.
- **Action row:** the **Apply** button as the primary monochrome CTA (solid black in light / solid white in dark), which opens `apply_url` in a new tab; and the **Save** bookmark next to it. On mobile this row becomes a sticky bottom bar so Apply is always reachable.
- **Description** section (the long `description`), then a **Requirements** section, each with a small section heading.
- **Related opportunities:** a heading ("You might also like" / «Похожие возможности») and a 3-card grid of opportunities sharing at least one tag, excluding the current one. If fewer than three exist, show what exists; if none, omit the section.

Everything text-bearing is pulled from the row's JSONB in the active locale, falling back to English if a translation is missing.

---

## 9. Save / Apply flows and visitor↔student gating

**Save (bookmark):**
- *Signed-in student:* clicking toggles saved state **optimistically** — the icon fills immediately, the server action persists it, and a quiet toast confirms ("Saved" / "Removed"). If the server call fails, the icon reverts and an error toast appears.
- *Visitor:* clicking opens the **SignInDialog**. After successful sign-in the user lands back where they were, and (nice-to-have) the originally clicked opportunity is auto-saved so the intent isn't lost.

**Apply:**
- For everyone, Apply opens the external `apply_url` in a new tab.
- *Additionally, for signed-in students,* the opportunity's saved status is upgraded to "applied" (auto-saving it first if it wasn't saved), so the dashboard can later show an "Applied" track. Visitors just get the external link with no tracking.

**Gating summary:** browse, search, filter, sort, open detail, and click Apply (external) are open to all. Save and applied-tracking require a session; the sign-in dialog is the single, reused gate. The finished feel is "nothing is walled off from a curious visitor, but your stuff is yours once you sign in."

---

## 10. States — loading, empty, error (concrete)

- **Loading / navigating:** while results refetch after a filter change, the grid shows **skeleton cards** (same footprint as real cards) via Suspense, so layout never jumps. The filter rail and header stay interactive.
- **Empty (filters too narrow):** a centered, considered empty state — a short message ("No opportunities match these filters" / «Ничего не найдено по этим фильтрам»), a one-line suggestion, and a **"Clear filters"** button. This is visually distinct from a generic blank.
- **Empty (no query yet on a fresh page):** never happens — the default view lists everything sorted by soonest deadline.
- **Error:** if a fetch fails, a calm inline error with a "Try again" affordance, never a crash.

These states are part of "feels like a real product" and feed the UX score directly — they are required deliverables, not polish.

---

## 11. Visual & interaction spec (applying the design system)

- **Palette discipline:** the entire feature is black/white/neutral. The brand accent does **not** appear here — Discovery has no progress or success semantics. Saved state, urgency, badges, and hovers are all expressed in monochrome weight, fill, and border. (The accent's first appearance is the active-nav indicator and, later, course progress.)
- **Type & shape:** Geist throughout; hairline borders; minimal radius; whitespace-led layout; flat surfaces with restrained hover elevation.
- **Motion (Framer Motion, restrained):** card hover lift; the save bookmark a quick fill/scale tap; filter sheet slide-in on mobile; results cross-fade on navigation. Nothing bouncy or slow.
- **Responsive:** 3/2/1-column grid; sticky filter rail on desktop → filter sheet on mobile; sticky Apply bar on mobile detail.
- **Accessibility:** every icon-only control (save bookmark, remove-chip) has an accessible label; filter controls are fully keyboard operable; visible focus rings; headings are semantic; monochrome high-contrast easily clears WCAG AA.

---

## 12. Data & mutations (no code — just the contract)

- **Reads** all go through the Phase 1 provider: the page calls `listOpportunities(filters)` and `getTags()`; if there's a session it also calls `listSaved(userId)` and passes the saved-ID set down so cards render the correct bookmark state on first paint. The detail page calls `getOpportunity(id)` and a tag-filtered `listOpportunities` for related items.
- **Mutations** are thin **server actions** wrapping the provider — `saveOpportunity`, `unsaveOpportunity`, and `setOpportunityStatus(...,'applied')` — each re-validating the relevant path so server-rendered saved state stays correct. The client components call these actions; they never touch Supabase directly (the provider indirection from Phase 0 holds).

---

## 13. Internationalization & formatting

- **UI chrome** (titles, button labels, filter names, empty-state text, toasts) comes from a new `opportunities` namespace in `messages/{ru,en,kk}.json`.
- **Content** (opportunity title/summary/description/requirements) and **tag labels** are read from row JSONB / the tags dictionary in the active locale, with English fallback.
- **Deadlines, ranges, and counts** are formatted locale-aware (relative time like "12 days left" and absolute dates both localized). Switching language via the header re-renders all of the above without losing the current filters (locale lives in the path; query params are preserved across the switch).

---

## 14. Build prompts (architecture-level requests + acceptance)

**BP2-1 — Catalog shell & data wiring.** Build `OpportunitiesPage` as a Server Component that parses the §5 query schema into `OpportunityFilters`, fetches results + tags + saved IDs, and lays out the two-column desktop / stacked-mobile structure of §3. *Acceptance:* visiting `/opportunities` lists all 10 seeded items, soonest-deadline first, fully server-rendered.

**BP2-2 — Filter rail, search, sort, active filters.** Implement `FilterRail`, `SearchBar` (debounced), `SortDropdown`, and `ActiveFilters` as URL-driven clients per §5–§6, plus the mobile `FiltersSheet`. *Acceptance:* every control reflects in the URL; reloading a filtered URL reproduces the exact view; "Clear all" empties discovery params; mobile sheet works.

**BP2-3 — Card & grid with states.** Build `OpportunityCard` (§7), `ResultsGrid`, skeleton loading, and the empty/error states (§10). *Acceptance:* responsive 3/2/1 grid; skeletons show during navigation; narrowing filters to zero shows the empty state with a working "Clear filters."

**BP2-4 — Save flow & gating.** Implement `SaveButton` (optimistic), the `saveOpportunity`/`unsaveOpportunity` server actions, and `SignInDialog` gating for visitors (§9). *Acceptance:* a signed-in user toggles save with instant feedback that persists across reload; a visitor clicking save gets the sign-in dialog and the item is saved after returning.

**BP2-5 — Detail page, apply, related.** Build `OpportunityDetail` (§8), `ApplyButton` with applied-tracking for students, and `RelatedOpportunities`. *Acceptance:* detail renders all fields in the active locale; Apply opens the external link in a new tab and (signed-in) marks "applied"; related shows up to 3 tag-matched items.

**BP2-6 — i18n & polish.** Add the `opportunities` message namespace in all three locales, wire locale-aware date/relative formatting, and apply the motion/responsive/a11y spec (§11). *Acceptance:* switching RU/EN/KK translates all chrome and reformats deadlines while preserving active filters; keyboard and screen-reader pass on all controls; no brand-accent color appears anywhere in Discovery.

---

## 15. Definition of Done for Phase 2

- `/opportunities` lists the seeded opportunities, server-rendered, soonest-deadline first.
- Search, all five filters, sort, and pagination are fully URL-driven, shareable, and Back-button correct.
- Cards and the detail page render correctly in RU/EN/KK with English fallback; deadlines are localized.
- Signed-in students can save/unsave with optimistic feedback that persists; visitors are cleanly prompted to sign in and don't lose their intent.
- Apply opens the external link for everyone and records "applied" for signed-in students.
- Loading (skeleton), empty, and error states all exist and look intentional.
- Fully responsive; keyboard- and screen-reader-accessible; strictly monochrome (no accent color in this feature).

---

## 16. What Phase 3 will cover (preview)

**Phase 3 — Learning Engine (Courses):** the courses catalog, the course detail page (lesson list, materials, progress), the lesson player (video placeholder + text body), the in-lesson quiz with server-side grading, live progress tracking, course completion, and the certificate moment — wired to `getCourseBySlug`, `getLessonForLearner`, `enroll`, `completeLesson`, `gradeQuiz`, `getCourseProgress`, and `issueCertificate`. This is where the brand accent makes its entrance (progress fills, the pass state, the certificate seal), and where the second half of the demo spine — "she completes a lesson and a quiz, her progress advances, she earns a certificate" — comes to life.
