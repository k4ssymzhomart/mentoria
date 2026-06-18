import { getSessionUser } from '@/lib/auth';
import { routing } from '@/i18n/routing';
import { runAssistant } from '@/lib/assistant/service';
import type { AssistantContext, AssistantRequest, ChatMessage } from '@/lib/assistant/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONTEXT_KINDS = new Set(['chat', 'explain', 'ask', 'roadmap']);

function cleanLocale(value: unknown) {
  return typeof value === 'string' && (routing.locales as readonly string[]).includes(value)
    ? value
    : routing.defaultLocale;
}

function cleanMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((m): m is ChatMessage =>
      Boolean(
        m &&
          typeof m === 'object' &&
          (m as ChatMessage).role &&
          ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant') &&
          typeof (m as ChatMessage).content === 'string',
      ),
    )
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1_200) }));
}

function cleanContext(value: unknown): AssistantContext {
  if (!value || typeof value !== 'object') return { kind: 'chat' };
  const raw = value as AssistantContext;
  return {
    kind: CONTEXT_KINDS.has(raw.kind) ? raw.kind : 'chat',
    itemType: raw.itemType === 'opportunity' || raw.itemType === 'course' ? raw.itemType : undefined,
    itemId: typeof raw.itemId === 'string' ? raw.itemId : undefined,
  };
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Partial<AssistantRequest>;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const locale = cleanLocale(body.locale);
  const messages = cleanMessages(body.messages);
  const context = cleanContext(body.context);
  const stream = await runAssistant(user.id, locale, messages, context);

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
