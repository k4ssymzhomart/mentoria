'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Tag } from '@/lib/data/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { FilterRail } from './filter-rail';

export function FiltersSheet({
  tags,
  myGrade,
  activeCount,
}: {
  tags: Tag[];
  myGrade?: number | null;
  activeCount: number;
}) {
  const t = useTranslations('opportunities');
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" className="lg:hidden" />}>
        <SlidersHorizontal className="size-4" />
        {t('filtersButton')}
        {activeCount > 0 ? (
          <Badge variant="secondary" className="ml-1">
            {activeCount}
          </Badge>
        ) : null}
      </SheetTrigger>
      <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('filters.title')}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-10">
          <FilterRail tags={tags} myGrade={myGrade} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
