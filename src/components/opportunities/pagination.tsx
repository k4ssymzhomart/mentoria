'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useDiscovery } from './use-discovery';

export function Pagination({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const t = useTranslations('opportunities');
  const { setPage } = useDiscovery();
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;

  const from = page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);

  return (
    <div className="flex items-center justify-between gap-4 pt-2">
      <p className="text-sm tabular-nums text-muted-foreground">
        {t('results.range', { from, to, total })}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage(page - 1)}>
          <ChevronLeft className="size-4" />
          {t('pagination.prev')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages - 1}
          onClick={() => setPage(page + 1)}
        >
          {t('pagination.next')}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
