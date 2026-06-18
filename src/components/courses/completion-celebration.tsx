'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

/**
 * A brief, dignified accent moment on course completion — not a confetti storm.
 * Offers the certificate (when issued) and a way back to reviewing.
 */
export function CompletionCelebration({
  open,
  onOpenChange,
  serial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serial: string | null;
}) {
  const t = useTranslations('certificate');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="grid size-14 animate-in zoom-in-50 place-items-center rounded-full bg-brand/15 duration-300">
            <Check className="size-7 text-brand" />
          </span>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">{t('celebration.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('celebration.body')}</p>
          </div>
          <div className="flex w-full flex-col gap-2 pt-2">
            {serial ? (
              <Button nativeButton={false} render={<Link href={`/certificates/${serial}`} />} className="w-full">
                {t('celebration.view')}
              </Button>
            ) : null}
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              {t('celebration.stay')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
