'use client';

import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AssistantPromptButton } from './assistant-entry';

export function AssistantPromptCard() {
  const t = useTranslations('assistant');
  const prompts = [
    t('prompts.olympiads'),
    t('prompts.plan'),
    t('prompts.ielts'),
    t('prompts.scholarships'),
  ];

  return (
    <section className="rounded-lg border p-4">
      <div className="flex gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md border">
          <MessageCircle className="size-4" />
        </span>
        <div className="space-y-3">
          <div>
            <h2 className="font-semibold tracking-tight">{t('card.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('card.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <AssistantPromptButton key={prompt} prompt={prompt} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
