'use client';

import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { RouteStatus } from '@/components/route-state';

export function RouteErrorBoundary({ reset }: { reset: () => void }) {
  const t = useTranslations('states.error');
  const tn = useTranslations('states.notFound');

  return (
    <RouteStatus
      kind="error"
      title={t('title')}
      description={t('body')}
      actionLabel={tn('home')}
    >
      <Button onClick={reset}>
        <RefreshCw className="size-4" />
        {t('retry')}
      </Button>
    </RouteStatus>
  );
}
