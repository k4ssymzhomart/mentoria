'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { SignInDialog } from '@/components/shell/sign-in-dialog';
import { useAssistant } from './assistant-provider';
import type { AssistantContext } from '@/lib/assistant/types';

type EntryProps = {
  prompt?: string;
  context?: AssistantContext;
  canAsk?: boolean;
  variant?: 'button' | 'ghost' | 'text';
  label?: string;
  className?: string;
};

export function AssistantHeaderButton() {
  const t = useTranslations('assistant');
  const { openAssistant } = useAssistant();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => openAssistant()}
      aria-label={t('open')}
      className="gap-1.5"
    >
      <MessageCircle className="size-4" />
      <span className="hidden lg:inline">{t('open')}</span>
    </Button>
  );
}

export function AssistantEntryButton({
  prompt,
  context = { kind: 'chat' },
  canAsk = true,
  variant = 'button',
  label,
  className,
}: EntryProps) {
  const t = useTranslations('assistant');
  const { openAssistant } = useAssistant();
  const text = label ?? t('open');
  const [signInOpen, setSignInOpen] = useState(false);

  if (!canAsk) {
    return (
      <>
        <Button
          type="button"
          variant={variant === 'ghost' ? 'ghost' : 'outline'}
          size="sm"
          className={className}
          onClick={() => setSignInOpen(true)}
        >
          <MessageCircle className="size-4" />
          {text}
        </Button>
        <SignInDialog
          open={signInOpen}
          onOpenChange={setSignInOpen}
          showTrigger={false}
          title={t('signInTitle')}
          description={t('signInBody')}
        />
      </>
    );
  }

  if (variant === 'text') {
    return (
      <button
        type="button"
        onClick={() => openAssistant({ prompt, context })}
        className={className ?? 'text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'}
      >
        {text}
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant === 'ghost' ? 'ghost' : 'outline'}
      size="sm"
      onClick={() => openAssistant({ prompt, context })}
      className={className}
    >
      <MessageCircle className="size-4" />
      {text}
    </Button>
  );
}

export function AssistantPromptButton({ prompt }: { prompt: string }) {
  const { openAssistant } = useAssistant();

  return (
    <button
      type="button"
      onClick={() => openAssistant({ prompt, context: { kind: 'chat' } })}
      className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
    >
      {prompt}
    </button>
  );
}
