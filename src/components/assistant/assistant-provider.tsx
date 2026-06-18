'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import {
  Bookmark,
  Eye,
  GraduationCap,
  MessageCircle,
  Plus,
  RotateCcw,
  Send,
  Square,
  Trophy,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  hideTrailingPartialMarker,
  parseAssistantRefMarker,
  shortenMarkerValue,
  stripAssistantArtifacts,
} from '@/lib/assistant/format';
import type { AssistantContext, ChatMessage, RefItem } from '@/lib/assistant/types';
import { saveOpportunityAction } from '@/lib/opportunities/actions';
import { upsertRoadmapItemAction } from '@/lib/personalization/actions';

type OpenAssistantOptions = {
  prompt?: string;
  context?: AssistantContext;
};

type UiMessage = ChatMessage & {
  id: string;
  refs?: RefItem[];
  fallback?: boolean;
};

type AssistantApi = {
  openAssistant: (options?: OpenAssistantOptions) => void;
};

const AssistantContextValue = createContext<AssistantApi | null>(null);
const DEFAULT_CONTEXT: AssistantContext = { kind: 'chat' };

function id() {
  return crypto.randomUUID();
}

export function useAssistant() {
  const ctx = useContext(AssistantContextValue);
  if (!ctx) {
    return { openAssistant: () => undefined };
  }
  return ctx;
}

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations('assistant');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [activeContext, setActiveContext] = useState<AssistantContext>(DEFAULT_CONTEXT);
  const abortRef = useRef<AbortController | null>(null);

  const sendPrompt = useCallback(
    async (prompt: string, context: AssistantContext = activeContext) => {
      const text = prompt.trim();
      if (!text || streaming) return;

      const userMessage: UiMessage = { id: id(), role: 'user', content: text };
      const assistantId = id();
      const assistantMessage: UiMessage = { id: assistantId, role: 'assistant', content: '' };
      const nextMessages = [...messages, userMessage];

      setMessages([...nextMessages, assistantMessage]);
      setInput('');
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      let buffer = '';

      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locale,
            context,
            messages: nextMessages.map(({ role, content }) => ({ role, content })),
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) throw new Error('assistant failed');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as
              | { type: 'text'; text: string }
              | { type: 'refs'; items: RefItem[] }
              | { type: 'meta'; fallback: boolean };

            if (event.type === 'text') {
              setMessages((current) =>
                current.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + event.text } : m,
                ),
              );
            }
            if (event.type === 'refs') {
              setMessages((current) =>
                current.map((m) => (m.id === assistantId ? { ...m, refs: event.items } : m)),
              );
            }
            if (event.type === 'meta') {
              setMessages((current) =>
                current.map((m) => (m.id === assistantId ? { ...m, fallback: event.fallback } : m)),
              );
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setMessages((current) =>
            current.map((m) =>
              m.id === assistantId ? { ...m, content: t('error'), fallback: true } : m,
            ),
          );
        }
      } finally {
        abortRef.current = null;
        setStreaming(false);
      }
    },
    [activeContext, locale, messages, streaming, t],
  );

  const openAssistant = useCallback(
    (options?: OpenAssistantOptions) => {
      const context = options?.context ?? activeContext;
      setActiveContext(context);
      setOpen(true);
      if (options?.prompt) void sendPrompt(options.prompt, context);
    },
    [activeContext, sendPrompt],
  );

  const value = useMemo(() => ({ openAssistant }), [openAssistant]);

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }

  function reset() {
    stop();
    setMessages([]);
    setActiveContext(DEFAULT_CONTEXT);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void sendPrompt(input);
  }

  const prompts = [
    t('prompts.olympiads'),
    t('prompts.plan'),
    t('prompts.ielts'),
    t('prompts.scholarships'),
  ];

  return (
    <AssistantContextValue.Provider value={value}>
      {children}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full gap-0 p-0 sm:max-w-md"
          aria-describedby="assistant-caption"
        >
          <SheetHeader className="border-b">
            <div className="flex items-start gap-3 pr-8">
              <span className="mt-0.5 grid size-8 place-items-center rounded-md border">
                <MessageCircle className="size-4" />
              </span>
              <div className="space-y-0.5">
                <SheetTitle>{t('title')}</SheetTitle>
                <SheetDescription id="assistant-caption">{t('caption')}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {messages.length === 0 ? (
              <div className="space-y-4 rounded-lg border border-dashed p-4">
                <p className="text-sm text-muted-foreground">{t('empty')}</p>
                <div className="flex flex-wrap gap-2">
                  {prompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendPrompt(prompt, { kind: 'chat' })}
                      className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <AssistantMessage key={message.id} message={message} />
              ))
            )}
            {streaming ? (
              <p className="text-xs text-muted-foreground">{t('streaming')}</p>
            ) : null}
          </div>

          <div className="border-t p-3">
            <div className="mb-2 flex justify-between">
              <Button type="button" variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="size-3.5" />
                {t('reset')}
              </Button>
              {streaming ? (
                <Button type="button" variant="outline" size="sm" onClick={stop}>
                  <Square className="size-3.5" />
                  {t('stop')}
                </Button>
              ) : null}
            </div>
            <form onSubmit={submit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('placeholder')}
                disabled={streaming}
                aria-label={t('placeholder')}
                className="h-10"
              />
              <Button type="submit" size="icon-lg" disabled={streaming || !input.trim()} aria-label={t('send')}>
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </AssistantContextValue.Provider>
  );
}

function AssistantMessage({ message }: { message: UiMessage }) {
  const t = useTranslations('assistant');
  const mine = message.role === 'user';
  const content = message.content || t('thinking');

  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[88%] space-y-3', mine && 'items-end')}>
        <div
          className={cn(
            'rounded-lg px-3 py-2 text-sm leading-relaxed',
            mine ? 'bg-foreground text-background' : 'border bg-card',
          )}
        >
          {!mine && message.fallback ? (
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t('unavailable')}</p>
          ) : null}
          {mine ? (
            <p className="whitespace-pre-line">{content}</p>
          ) : (
            <AssistantRichText content={content} refs={message.refs ?? []} />
          )}
        </div>
        {!mine && message.refs?.length ? (
          <div className="space-y-2">
            {message.refs.map((ref) => (
              <AssistantRefCard key={`${ref.kind}:${ref.id}`} item={ref} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const ASSISTANT_INLINE_RE =
  /(\*\*[^*\n]+?\*\*|`[^`\n]+?`|\[(?:course|opp|opportunity):[^\]\s]+\])/gi;

function AssistantRichText({ content, refs }: { content: string; refs: RefItem[] }) {
  const t = useTranslations('assistant');
  const clean = hideTrailingPartialMarker(stripAssistantArtifacts(content));
  const paragraphs = clean ? clean.split(/\n{2,}/) : [content];
  const labels = {
    course: t('kind.course'),
    opportunity: t('kind.opportunity'),
  };

  return (
    <div className="space-y-2">
      {paragraphs.map((paragraph, index) => (
        <p key={`${paragraph.slice(0, 12)}:${index}`} className="whitespace-pre-wrap">
          {renderInlineAssistantContent(paragraph, refs, labels)}
        </p>
      ))}
    </div>
  );
}

function renderInlineAssistantContent(
  content: string,
  refs: RefItem[],
  labels: Record<'course' | 'opportunity', string>,
) {
  const parts = content.split(ASSISTANT_INLINE_RE);
  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }

    const marker = parseAssistantRefMarker(part);
    if (marker) {
      const ref = refs.find(
        (item) =>
          item.kind === marker.kind &&
          (item.lookupKeys.includes(marker.value) || item.href.split('/').pop() === marker.value),
      );
      return <AssistantInlineRef key={index} marker={marker} refItem={ref} label={labels[marker.kind]} />;
    }

    return part;
  });
}

function AssistantInlineRef({
  marker,
  refItem,
  label,
}: {
  marker: NonNullable<ReturnType<typeof parseAssistantRefMarker>>;
  refItem?: RefItem;
  label: string;
}) {
  const Icon = marker.kind === 'course' ? GraduationCap : Trophy;
  const text = refItem?.label ?? shortenMarkerValue(marker.value);
  const className =
    'mx-0.5 inline-flex max-w-full items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-0.5 align-baseline text-xs font-medium text-foreground transition-colors hover:bg-muted';

  if (refItem) {
    return (
      <Link href={refItem.href} className={className}>
        <Icon className="size-3" aria-hidden />
        <span className="truncate">{text}</span>
      </Link>
    );
  }

  return (
    <span className={className} title={marker.value}>
      <Icon className="size-3" aria-hidden />
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate">{text}</span>
    </span>
  );
}

function AssistantRefCard({ item }: { item: RefItem }) {
  const t = useTranslations('assistant');
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const [pending, start] = useTransition();

  function save() {
    if (item.kind !== 'opportunity') return;
    start(async () => {
      const res = await saveOpportunityAction(item.id);
      if (res.ok) {
        setSaved(true);
        toast.success(t('refs.saved'));
      } else {
        toast.error(t('error'));
      }
    });
  }

  function addToRoadmap() {
    start(async () => {
      const res = await upsertRoadmapItemAction({
        id: crypto.randomUUID(),
        grade: item.grade,
        kind: item.kind,
        ref_id: item.id,
        title: item.title,
        status: 'todo',
        position: Date.now(),
      });
      if (res.ok) {
        setAdded(true);
        toast.success(t('refs.added'));
      } else {
        toast.error(t('error'));
      }
    });
  }

  return (
    <div id={`assistant-ref-${item.kind}-${item.id}`} className="scroll-mt-4 rounded-md border bg-background p-3">
      <div className="space-y-1">
        <p className="line-clamp-2 text-sm font-medium">{item.label}</p>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t(`kind.${item.kind}`)}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button nativeButton={false} variant="outline" size="sm" render={<Link href={item.href} />}>
          <Eye className="size-3.5" />
          {t('refs.view')}
        </Button>
        {item.kind === 'opportunity' ? (
          <Button variant="outline" size="sm" onClick={save} disabled={pending || saved}>
            <Bookmark className={cn('size-3.5', saved && 'fill-foreground')} />
            {saved ? t('refs.saved') : t('refs.save')}
          </Button>
        ) : null}
        <Button variant="outline" size="sm" onClick={addToRoadmap} disabled={pending || added}>
          <Plus className="size-3.5" />
          {added ? t('refs.added') : t('refs.add')}
        </Button>
      </div>
    </div>
  );
}
