'use client';

import { useState, useTransition } from 'react';
import { Bookmark } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SignInDialog } from '@/components/shell/sign-in-dialog';
import {
  saveOpportunityAction,
  unsaveOpportunityAction,
} from '@/lib/opportunities/actions';

export function SaveButton({
  opportunityId,
  initialSaved,
  canSave,
  variant = 'icon',
}: {
  opportunityId: string;
  initialSaved: boolean;
  canSave: boolean;
  variant?: 'icon' | 'full';
}) {
  const t = useTranslations('opportunities');
  const pathname = usePathname();
  const sp = useSearchParams();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  const qs = sp.toString();
  const next = qs ? `${pathname}?${qs}` : pathname;
  const label = saved ? t('card.saved') : t('card.save');

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!canSave) {
      setDialogOpen(true);
      return;
    }
    const nextSaved = !saved;
    setSaved(nextSaved); // optimistic
    start(async () => {
      const res = nextSaved
        ? await saveOpportunityAction(opportunityId)
        : await unsaveOpportunityAction(opportunityId);
      if (!res.ok) {
        setSaved(!nextSaved); // revert
        if (res.reason === 'auth') setDialogOpen(true);
        else toast.error(t('save.error'));
      } else {
        toast.success(nextSaved ? t('save.saved') : t('save.removed'));
      }
    });
  }

  return (
    <>
      {variant === 'icon' ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          aria-pressed={saved}
          onClick={onClick}
          disabled={pending}
          className="relative z-10 -mr-2 -mt-1"
        >
          <Bookmark
            className={cn(
              'size-4 transition-transform duration-150',
              saved && 'fill-foreground',
              pending && 'scale-90',
            )}
          />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={onClick}
          disabled={pending}
          aria-pressed={saved}
        >
          <Bookmark className={cn('size-4', saved && 'fill-foreground')} />
          {label}
        </Button>
      )}

      {!canSave ? (
        <SignInDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          showTrigger={false}
          next={next}
          title={t('save.signInTitle')}
          description={t('save.signInBody')}
        />
      ) : null}
    </>
  );
}
