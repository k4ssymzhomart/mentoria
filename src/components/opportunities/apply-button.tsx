'use client';

import { useTransition } from 'react';
import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { setAppliedAction } from '@/lib/opportunities/actions';

export function ApplyButton({
  opportunityId,
  applyUrl,
  canTrack,
  size = 'default',
  className,
}: {
  opportunityId: string;
  applyUrl: string | null;
  canTrack: boolean;
  size?: 'default' | 'lg';
  className?: string;
}) {
  const t = useTranslations('opportunities');
  const [pending, start] = useTransition();

  function onClick() {
    if (applyUrl) window.open(applyUrl, '_blank', 'noopener,noreferrer');
    if (canTrack) {
      start(async () => {
        const res = await setAppliedAction(opportunityId);
        if (res.ok) toast.success(t('apply.appliedToast'));
      });
    }
  }

  return (
    <Button onClick={onClick} size={size} className={className} disabled={pending}>
      <ExternalLink className="size-4" />
      {t('apply.apply')}
    </Button>
  );
}
