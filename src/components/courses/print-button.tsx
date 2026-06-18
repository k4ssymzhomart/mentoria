'use client';

import { Printer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

/** Print / Save as PDF — the browser print dialog over the print-optimized layout. */
export function PrintButton() {
  const t = useTranslations('certificate');
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Printer className="size-4" />
      {t('print')}
    </Button>
  );
}
