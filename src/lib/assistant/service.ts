import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/data/provider';
import { getProfile } from '@/lib/auth';
import { tl } from '@/lib/data/types';
import type { Localized, Opportunity, Course, Tag } from '@/lib/data/types';
import { interestVector, overlapLabels } from '@/lib/personalization/recommend';
import type { AssistantContext, ChatMessage, DraftItem, RefItem } from './types';

// Sonnet-class per the Phase 5 spec (latency/cost balance for a streaming chat
// assistant); overridable via ANTHROPIC_MODEL. Server-only — the key never ships
// to the client.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const LOCALE_NAME: Record<string, string> = { en: 'English', ru: 'Russian', kk: 'Kazakh' };

type Candidate = {
  id: string;
  kind: 'opportunity' | 'course';
  title: Localized;
  tags: string[];
  deadline?: string | null;
  href: string;
};

type Grounding = {
  profile: Awaited<ReturnType<typeof getProfile>>;
  vector: string[];
  candidates: Candidate[];
  tagMap: Map<string, Tag>;
};

// ── Grounding: a bounded slice of the REAL catalog + profile ────────────────
async function buildGrounding(context: AssistantContext): Promise<Grounding> {
  const profile = await getProfile();
  const vector = interestVector(profile);
  const grade = profile?.grade ?? null;
  const [opps, courses, tags] = await Promise.all([
    db.recommendOpportunities(vector, grade, 5),
    db.recommendCourses(vector, 5),
    db.getTags(),
  ]);
  const tagMap = new Map(tags.map((t) => [t.slug, t]));

  const candidates: Candidate[] = [];
  const push = (o: Opportunity) =>
    candidates.push({ id: o.id, kind: 'opportunity', title: o.title, tags: o.tags, deadline: o.deadline, href: `/opportunities/${o.id}` });
  const pushCourse = (c: Course) =>
    candidates.push({ id: c.id, kind: 'course', title: c.title, tags: c.tags, href: `/courses/${c.slug}` });
  opps.forEach(push);
  courses.forEach(pushCourse);

  // Always include the explicitly-referenced item (Explain / Ask about this).
  if (context.itemId && !candidates.some((c) => c.id === context.itemId)) {
    if (context.itemType === 'opportunity') {
      const o = await db.getOpportunity(context.itemId);
      if (o) candidates.unshift({ id: o.id, kind: 'opportunity', title: o.title, tags: o.tags, deadline: o.deadline, href: `/opportunities/${o.id}` });
    } else {
      const c = (await db.listCourses()).find((x) => x.id === context.itemId);
      if (c) candidates.unshift({ id: c.id, kind: 'course', title: c.title, tags: c.tags, href: `/courses/${c.slug}` });
    }
  }

  return { profile, vector, candidates, tagMap };
}

function toRef(c: Candidate, locale: string): RefItem {
  return { id: c.id, kind: c.kind, title: c.title, label: tl(c.title, locale), href: c.href, grade: c.kind === 'course' ? 10 : 11 };
}

/**
 * References are chosen by the SERVER from the real candidate set — so the user
 * can only ever see real, clickable items, regardless of what the model writes.
 */
function refsFor(context: AssistantContext, grounding: Grounding, locale: string): RefItem[] {
  const { candidates } = grounding;
  if ((context.kind === 'explain' || context.kind === 'ask') && context.itemId) {
    const primary = candidates.find((c) => c.id === context.itemId);
    const rest = candidates.filter((c) => c.id !== context.itemId).slice(0, 2);
    return [primary, ...rest].filter(Boolean).map((c) => toRef(c as Candidate, locale));
  }
  return candidates.slice(0, 4).map((c) => toRef(c, locale));
}

async function deterministicText(locale: string, context: AssistantContext, grounding: Grounding): Promise<string> {
  const t = await getTranslations({ locale, namespace: 'assistant' });
  const { candidates, vector, tagMap } = grounding;
  if (context.kind === 'explain' && context.itemId) {
    const item = candidates.find((c) => c.id === context.itemId);
    const tags = item ? overlapLabels(item.tags, vector, tagMap, locale) : [];
    const labels = tags.length ? tags : item?.tags.filter((x) => vector.includes(x)).slice(0, 2) ?? [];
    return labels.length ? t('fallback.explain', { tags: labels.join(', ') }) : t('fallback.explainGeneric');
  }
  if (context.kind === 'roadmap') return t('fallback.roadmap');
  if (candidates.length === 0) return t('fallback.nothing');
  return `${context.kind === 'ask' ? t('fallback.generic') : t('fallback.recommend')} ${t('fallback.confirm')}`;
}

// ── Per-user rate limit (best-effort, in-memory) ────────────────────────────
const RATE = new Map<string, { count: number; reset: number }>();
function withinRateLimit(userId: string): boolean {
  const now = Date.now();
  const e = RATE.get(userId);
  if (!e || now > e.reset) {
    RATE.set(userId, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (e.count >= 20) return false;
  e.count += 1;
  return true;
}

function systemPrompt(localeName: string, grounding: Grounding): string {
  const profile = grounding.profile;
  const ctx = grounding.candidates
    .map((c) => `- [${c.kind}:${c.id}] ${tl(c.title, 'en')} (tags: ${c.tags.join(', ') || 'none'}${c.deadline ? `, deadline: ${c.deadline}` : ''})`)
    .join('\n');
  const interests = [...(profile?.interests ?? []), ...(profile?.subjects ?? [])].join(', ') || 'none';
  return [
    'You are the Mentoria Assistant, a concise, encouraging academic mentor for students in grades 8–11.',
    `Always answer in ${localeName}. Keep replies under 120 words.`,
    'Only discuss items present in the catalog context below; never invent programs, deadlines, fees, or URLs.',
    'If nothing in the context fits, say so plainly and suggest broadening interests rather than fabricating.',
    'Remind the student to confirm deadlines and links on the official source. Be honest about uncertainty.',
    `Student profile: grade ${profile?.grade ?? 'unknown'}; interests: ${interests}.`,
    '',
    'Catalog context (the only items you may reference):',
    ctx || '(no matching items)',
  ].join('\n');
}

/**
 * Streams the assistant answer as NDJSON lines:
 *   {"type":"text","text":"…"}  (repeated)
 *   {"type":"refs","items":[…]}
 *   {"type":"meta","fallback":bool}
 * When the key is missing, the rate limit is hit, or the model errors before any
 * text, it emits the deterministic Phase-4 answer instead — never an error.
 */
export async function runAssistant(userId: string, locale: string, messages: ChatMessage[], context: AssistantContext): Promise<ReadableStream<Uint8Array>> {
  const enc = new TextEncoder();
  const grounding = await buildGrounding(context);
  const refs = refsFor(context, grounding, locale);

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const line = (o: unknown) => controller.enqueue(enc.encode(JSON.stringify(o) + '\n'));
      let gotText = false;
      try {
        if (isAiConfigured() && withinRateLimit(userId)) {
          const client = new Anthropic();
          const stream = client.messages.stream({
            model: MODEL,
            max_tokens: 400,
            system: systemPrompt(LOCALE_NAME[locale] ?? 'English', grounding),
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          });
          for await (const ev of stream) {
            if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta' && ev.delta.text) {
              gotText = true;
              line({ type: 'text', text: ev.delta.text });
            }
          }
          await stream.finalMessage();
        }
      } catch {
        // fall through to deterministic answer
      }
      if (!gotText) {
        line({ type: 'text', text: await deterministicText(locale, context, grounding) });
      }
      line({ type: 'refs', items: refs });
      line({ type: 'meta', fallback: !gotText });
      controller.close();
    },
  });
}

// ── AI-drafted roadmap (deterministic fallback shape; real validated items) ──
const COURSE_GRADE: Record<string, number> = { sat: 9, ielts: 9, admissions: 11 };
const OPP_GRADE: Partial<Record<string, number>> = {
  volunteering: 9, summer_school: 9, olympiad: 10, competition: 10, hackathon: 10, conference: 10,
  research: 11, internship: 11, scholarship: 11,
};

function deterministicRoadmapItems({
  locale,
  vector,
  tagMap,
  courses,
  opps,
}: {
  locale: string;
  vector: string[];
  tagMap: Map<string, Tag>;
  courses: Course[];
  opps: Opportunity[];
}): DraftItem[] {
  const rationale = (itemTags: string[]) => overlapLabels(itemTags, vector, tagMap, locale).join(', ');

  const items: DraftItem[] = [];
  for (const c of courses) {
    items.push({
      kind: 'course',
      ref_id: c.id,
      title: c.title,
      label: tl(c.title, locale),
      grade: COURSE_GRADE[c.subject ?? ''] ?? 10,
      rationale: rationale(c.tags),
    });
  }
  for (const o of opps.slice(0, 6)) {
    items.push({
      kind: 'opportunity',
      ref_id: o.id,
      title: o.title,
      label: tl(o.title, locale),
      grade: OPP_GRADE[o.type] ?? 10,
      rationale: rationale(o.tags),
    });
  }
  return items.sort((a, b) => a.grade - b.grade);
}

function extractJsonArray(text: string): unknown[] | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf('[');
  const end = trimmed.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function messageText(message: unknown): string {
  const content = (message as { content?: unknown }).content;
  if (!Array.isArray(content)) return '';
  return content
    .map((block) => {
      if (!block || typeof block !== 'object') return '';
      const typed = block as { type?: unknown; text?: unknown };
      return typed.type === 'text' && typeof typed.text === 'string' ? typed.text : '';
    })
    .filter(Boolean)
    .join('\n');
}

export async function draftRoadmap(userId: string, locale: string): Promise<{ items: DraftItem[]; fallback: boolean }> {
  const profile = await getProfile();
  const vector = interestVector(profile);
  const tags = await db.getTags();
  const tagMap = new Map(tags.map((t) => [t.slug, t]));
  const [courses, opps] = await Promise.all([
    db.recommendCourses(vector, 6),
    db.recommendOpportunities(vector, profile?.grade ?? null, 8),
  ]);

  const fallbackItems = deterministicRoadmapItems({ locale, vector, tagMap, courses, opps });
  if (!isAiConfigured() || !withinRateLimit(userId)) return { items: fallbackItems, fallback: true };

  const courseById = new Map(courses.map((c) => [c.id, c]));
  const oppById = new Map(opps.map((o) => [o.id, o]));
  const candidates = [
    ...courses.map((c) => ({
      kind: 'course',
      id: c.id,
      title: tl(c.title, locale),
      tags: c.tags,
      suggestedGrade: COURSE_GRADE[c.subject ?? ''] ?? 10,
    })),
    ...opps.map((o) => ({
      kind: 'opportunity',
      id: o.id,
      title: tl(o.title, locale),
      tags: o.tags,
      suggestedGrade: OPP_GRADE[o.type] ?? 10,
      deadline: o.deadline,
    })),
  ];

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: [
        'You draft concise educational roadmaps for students in grades 9-12.',
        `Answer only with valid JSON. Use ${LOCALE_NAME[locale] ?? 'English'} for rationale text.`,
        'Use only the provided real catalog ids. Do not invent ids, deadlines, links, or programs.',
        'Return an array of 5-8 objects: {"kind":"course"|"opportunity","ref_id":"...","grade":9|10|11|12,"rationale":"short reason"}.',
      ].join('\n'),
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            student: {
              grade: profile?.grade ?? null,
              interests: vector,
              goals: profile?.goals ?? [],
            },
            catalog: candidates,
          }),
        },
      ],
    });
    const parsed = extractJsonArray(messageText(message));
    if (!parsed) return { items: fallbackItems, fallback: true };

    const seen = new Set<string>();
    const items: DraftItem[] = [];
    for (const raw of parsed) {
      if (!raw || typeof raw !== 'object') continue;
      const row = raw as { kind?: unknown; ref_id?: unknown; grade?: unknown; rationale?: unknown };
      const kind = row.kind === 'course' || row.kind === 'opportunity' ? row.kind : null;
      const refId = typeof row.ref_id === 'string' ? row.ref_id : null;
      const grade = typeof row.grade === 'number' && row.grade >= 9 && row.grade <= 12 ? row.grade : null;
      if (!kind || !refId || !grade || seen.has(`${kind}:${refId}`)) continue;
      const source = kind === 'course' ? courseById.get(refId) : oppById.get(refId);
      if (!source) continue;
      seen.add(`${kind}:${refId}`);
      const fallbackRationale = overlapLabels(source.tags, vector, tagMap, locale).join(', ');
      items.push({
        kind,
        ref_id: source.id,
        title: source.title,
        label: tl(source.title, locale),
        grade,
        rationale: typeof row.rationale === 'string' && row.rationale.trim() ? row.rationale.trim() : fallbackRationale,
      });
    }
    return items.length ? { items: items.sort((a, b) => a.grade - b.grade), fallback: false } : { items: fallbackItems, fallback: true };
  } catch {
    return { items: fallbackItems, fallback: true };
  }
}
