'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function OpportunitiesError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('opportunities');
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
      <p className="text-lg font-medium">{t('error.title')}</p>
      <Button variant="outline" onClick={reset}>
        {t('error.retry')}
      </Button>
    </div>
  );
}
