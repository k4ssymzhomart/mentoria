# Mentoria Hub — Phase 5: AI Layer (Assistant + Explained Recommendations + AI Roadmap)

> **Format:** architecture and the concrete final result only — no code. Defines surfaces, the AI request architecture, grounding, data flows, states, and finished behavior. Your coding agent implements against it.

**Goal of Phase 5:** add a conversational AI mentor that answers free-form questions, explains *why* things are recommended in natural language, and can draft a personalized roadmap — always **grounded in the real catalog and the student's profile**, always in the student's language, and always **degrading gracefully** to the deterministic Phase 4 logic if the AI is unavailable. This is the Innovation-criterion flagship, layered on a product that already functions end-to-end without it.

**Governing principle:** the AI is an *enhancement*, never a dependency. Every AI surface has a deterministic fallback already built (Phase 4). If the model call fails, the key is missing, or the network drops, the user sees the deterministic recommendation/explanation instead of an error. The demo cannot break on an API hiccup.

**Where it sits:** Engine 3 (Personalization), AI sub-layer. It reads the same catalog and profile data through the Phase 1 `db` provider for grounding, reuses Phase 4's recommendation RPCs as both context and fallback, and writes roadmap items through `upsertRoadmapItem`. The only new infrastructure is a protected server endpoint and the `ANTHROPIC_API_KEY` env var (already reserved in Phase 0).

---

## 1. Scope

**In scope:** a conversational assistant reachable app-wide; grounded answers that reference only real catalog items; an "Explain this" affordance on recommendations; an AI-drafted roadmap the student can accept with one tap; streaming responses; multilingual replies (RU/EN/KK); guardrails, grounding validation, and graceful degradation.

**Out of scope (later):** admin content management and analytics (Phase 6); final polish, deploy hardening, and demo rehearsal (Phase 7). Persisting chat history across sessions is optional and deferred (chat is session-scoped in the MVP).

---

## 2. The non-negotiable architecture: key safety + grounding + fallback

Three rules shape every decision in this phase:

1. **The key never reaches the browser.** All model calls go through a **protected server endpoint** (a Next.js route handler / server action). The client sends messages and context flags; the server holds `ANTHROPIC_API_KEY`, assembles the prompt, calls the model, and streams text back. The client never sees the key or calls the model directly.
2. **Answers are grounded in real data, not the model's imagination.** Before calling the model, the server retrieves a bounded slice of the **real catalog** (opportunities/courses relevant to the query + the student's interest vector) plus the **student's profile and saved/enrolled state**, and passes it as structured context. The system instruction forbids inventing programs, deadlines, or links and requires the model to reference items **by id** from the provided context only. The server then **validates** every referenced id against real rows before the UI renders it — so the user can only ever see real, clickable opportunities/courses.
3. **Every AI surface has a deterministic twin.** "Recommend things" → Phase 4 `recommend_*`. "Explain this" → the tag-overlap "why." "Draft my roadmap" → Phase 4 generate-starter. If the AI path errors, the twin renders instead, with a quiet note that the assistant is temporarily unavailable.

---

## 3. The request flow (concrete, no code)

1. **Client** (chat UI) posts the conversation so far + optional context flags (e.g., "this is about opportunity X", "the user clicked Explain on item Y") to the assistant endpoint.
2. **Server** authenticates the user (must be signed in), then:
   - loads the profile (grade, interest vector, goals) and the student's saved/enrolled items;
   - derives query intent and retrieves a bounded candidate set from the catalog (keyword/tag match against opportunities + courses, capped to keep tokens bounded), reusing the recommendation RPCs where the query is "what fits me"-shaped;
   - assembles a **system instruction** (role, locale, grounding + honesty rules, tone, scope) plus the structured catalog context and profile;
   - calls a **current fast Claude model** (Sonnet-class for the latency/cost balance) via the Messages API with **streaming** and a capped max-output;
   - **streams** the response back to the client; when the model references item ids, the server validates them against real rows and emits them as a small structured "references" payload alongside the text.
3. **Client** renders the streamed text and turns validated references into **real catalog cards** (clickable to detail, savable, addable to roadmap).
4. **On any failure** (missing key, model/network error, timeout), the server returns the deterministic fallback for the query shape, and the client shows it with an "assistant temporarily unavailable" note instead of an error.

---

## 4. Surfaces & entry points (concrete final result)

- **App-wide assistant drawer.** A persistent "Assistant" entry in the app shell opens a slide-in chat panel (right-side drawer on desktop, full-screen sheet on mobile) that stays available on every authed page. Header: "Mentoria Assistant" with a small "Grounded in the Mentoria catalog" caption.
- **Empty-state suggested prompts.** When the chat is empty, localized starter chips: "Which olympiads fit me?", "Plan my next year", "How should I prep for IELTS?", "Find scholarships for STEM." Tapping one sends it.
- **Dashboard prompt card.** An "Ask Mentoria" card on the dashboard with the same starter prompts, opening the drawer.
- **"Explain this" on recommendations.** Each recommended card gets an "Explain" affordance; tapping it asks the assistant to articulate, conversationally and in the student's locale, why this item fits *them specifically* (vs. the terse tag "why" from Phase 4). If AI is down, it shows the deterministic tag rationale.
- **"Ask about this" on detail pages.** Opportunity and course detail pages have an "Ask about this" action that opens the drawer pre-seeded with that item as context (e.g., "Is this a good fit for me?", "How do I prepare?").
- **"Draft my roadmap with AI" on the roadmap page.** Produces a grade-by-grade plan referencing real catalog items for review (see §6).

All AI surfaces are **strictly monochrome** — the assistant is help, not progress/success, so the brand accent stays reserved.

---

## 5. The chat experience (concrete)

- A message list with monochrome user and assistant bubbles. Assistant messages stream token-by-token with a typing indicator and a **Stop** control.
- Assistant answers can interleave prose with **referenced item cards** (real, validated catalog cards) rendered inline or directly beneath the message, each with **Save** and **Add to roadmap** quick actions so a conversation turns directly into action.
- The input is disabled while streaming; a clear/reset control starts a new conversation.
- Chat is **session-scoped** (held in component state for the MVP); persisting history to a table is an optional later add.
- Tone is an encouraging, concise academic mentor for grades 8–11 — age-appropriate, never overconfident, honest about uncertainty, and explicit that deadlines/links should be confirmed on the official source.

---

## 6. AI-drafted roadmap (concrete)

- "Draft my roadmap with AI" sends the profile + a roadmap-shaped instruction; the model proposes a plan **spread across the student's remaining grades (9–12)**, referencing **real** courses and opportunities by id (validated server-side) plus optional custom milestones, with a one-line rationale per item.
- The result renders as a **reviewable preview** grouped by grade — the student can remove items before accepting.
- **"Add to roadmap"** persists the accepted items via `upsertRoadmapItem`, after which they behave exactly like manually added roadmap items (status, reorder, done-checks from Phase 4).
- If the AI is unavailable, this action falls back to Phase 4's deterministic **generate-starter** roadmap — same outcome shape, no error.

---

## 7. Guardrails, honesty & cost control

- **Scope & safety:** the system instruction constrains the assistant to educational guidance (opportunities, courses, study skills, admissions/test prep) for school students, redirects off-topic requests kindly, and refuses unsafe content.
- **Honesty / anti-hallucination:** reference only items in the provided context, by id; never invent programs, deadlines, fees, or URLs; if nothing in the catalog fits, say so plainly and suggest broadening interests rather than fabricating. The server's id-validation enforces this regardless of model behavior.
- **Locale:** always answer in the student's active app locale (RU/EN/KK).
- **Cost & abuse control:** bounded retrieval context, a capped max-output, and a simple per-user rate limit on the endpoint. Failures (including hitting the limit) route to the deterministic fallback with a clear message.

---

## 8. States — empty, streaming, complete, unavailable

- **Empty:** suggested-prompt chips.
- **Streaming:** partial text with typing indicator + Stop; input disabled.
- **Complete:** final text + any validated referenced cards with Save / Add-to-roadmap actions.
- **Unavailable / error / rate-limited:** a calm "assistant is temporarily unavailable" line **plus** the deterministic recommendations/explanation for the query — the surface stays useful, never blank or broken.
- **Not signed in:** AI entry points prompt sign-in (the endpoint requires a session).

---

## 9. Visual & interaction spec

- **Monochrome throughout** — the assistant never uses the brand accent (it's not progress/success). Referenced cards keep their own rules (a referenced *course* card may show its accent progress bar; the chat chrome itself stays monochrome).
- **Type & shape:** Geist; hairline borders; minimal radius; calm, readable chat layout with a comfortable measure.
- **Motion (restrained):** drawer slide-in; smooth token streaming; subtle appearance of referenced cards. No flashy "AI sparkle" theatrics — the credibility comes from real, clickable results.
- **Responsive:** right-side drawer on desktop, full-screen sheet on mobile, sticky input.
- **Accessibility:** the chat is keyboard operable; streaming text is announced politely (aria-live) without spamming; Stop and Send are labeled; suggested prompts are buttons; referenced cards are reachable and actionable by keyboard.

---

## 10. Data, services & contract (no code)

- **New:** a protected **assistant endpoint** plus a server-side **assistant service** with three capabilities — answer a grounded question (streaming), explain a recommendation, and draft a roadmap — each assembling context from the provider, calling the model, validating referenced ids, and owning its deterministic fallback.
- **New env:** `ANTHROPIC_API_KEY` (server-only; add to `.env.local` and Vercel).
- **Reuses:** the Phase 1 provider for grounding reads and id-validation, the Phase 4 `recommend_*` RPCs as both context and fallback, and `upsertRoadmapItem` to persist accepted AI roadmap items.
- The client only ever talks to the assistant endpoint; it never holds the key or calls the model directly. The provider indirection holds — grounding reads still go through `db` on the server.

---

## 11. Internationalization

- Assistant **replies** in the active app locale (instructed per request). Suggested prompts and all chat chrome come from a new `assistant` message namespace in `messages/{ru,en,kk}.json`. Referenced item cards localize from row JSONB as before.

---

## 12. Build prompts (architecture-level requests + acceptance)

**BP5-1 — Assistant service + protected endpoint + grounding + streaming + fallback.** Build the server endpoint and service per §2–§3: auth-gate it, assemble profile + bounded catalog context, call a current fast Claude model with streaming, validate referenced ids against real rows, and implement the deterministic fallback for every failure path. *Acceptance:* the key is never in the client bundle; a grounded question streams an answer that references only real, validated items; killing the key or forcing an error yields the deterministic fallback, not a crash.

**BP5-2 — Chat drawer + entry points + referenced cards.** Build the app-wide drawer, the dashboard prompt card, suggested prompts, the streaming message list with Stop, and inline referenced cards with Save / Add-to-roadmap actions (§4–§5). *Acceptance:* the assistant is reachable on every authed page; referenced items render as real cards and their actions work; chat is session-scoped and resettable.

**BP5-3 — Explain this (with deterministic fallback).** Add the "Explain" affordance to recommendation cards and "Ask about this" to detail pages, pre-seeding item context (§4). *Acceptance:* Explain returns a conversational, localized, item-specific rationale; with AI down it shows the Phase 4 tag rationale.

**BP5-4 — AI-drafted roadmap.** Build the "Draft my roadmap with AI" flow: proposal grouped by grade referencing real validated items, a review/remove step, and one-tap persistence via `upsertRoadmapItem`, with fallback to Phase 4 generate-starter (§6). *Acceptance:* the AI plan references only real items across grades 9–12; accepted items persist and behave like normal roadmap items; AI-down falls back cleanly.

**BP5-5 — Guardrails, honesty, cost control.** Encode the scope/safety/honesty system instruction, locale enforcement, id-validation enforcement, bounded context + capped output, and a per-user rate limit (§7). *Acceptance:* the assistant stays on-topic, never invents programs/deadlines/links, answers in the active locale, and rate-limited/over-budget requests route to the fallback with a clear message.

**BP5-6 — i18n, monochrome, a11y, degradation tests.** Add the `assistant` namespace in all locales; apply the monochrome rule and accessibility spec; verify graceful degradation across all four AI surfaces (§8–§11). *Acceptance:* RU/EN/KK chrome + replies; no brand accent on AI chrome; keyboard/screen-reader pass; with the key removed, all four surfaces still function via fallbacks.

---

## 13. Definition of Done for Phase 5

- A signed-in student can open an app-wide assistant, ask free-form questions, and get streamed, locale-correct answers that reference only **real, validated** catalog items.
- "Explain this" gives a conversational rationale on recommendations; "Ask about this" works from detail pages.
- "Draft my roadmap with AI" proposes a grade-spread plan of real items that the student can review and add in one tap.
- The API key is never exposed client-side; grounding reads go through the provider on the server; referenced ids are validated before render.
- The assistant stays on-topic, answers in RU/EN/KK, and never fabricates programs, deadlines, or links.
- **Every AI surface degrades gracefully** — removing the key or forcing an error leaves the product fully usable via the deterministic Phase 4 twins. The demo cannot break on the AI.
- AI chrome is strictly monochrome; fully responsive and accessible.

---

## 14. What Phase 6 will cover (preview)

**Phase 6 — Operations & Scale (Admin):** the admin dashboard and the content-management surfaces that make Mentoria look like a real, scalable organization — full CRUD for opportunities and courses/lessons/quizzes (trilingual JSONB editing, tag selection from the dictionary, publish/unpublish), a users list, and a small analytics view (users, enrollments, completions, saves). This implements the Phase 1 `admin*` provider methods (currently throwing "Phase 6") and closes the final demo-spine loop: **an admin adds a new olympiad → it appears live in a student's recommendations.** This is the Impact-criterion engine — proof the platform scales beyond Telegram without an engineer rebuilding anything.
