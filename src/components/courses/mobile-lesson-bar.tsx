'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ProgressBar } from './progress-bar';

/**
 * Mobile-only top bar: an always-visible mini progress bar plus a "Lessons"
 * trigger opening the drawer. The drawer body is the server-rendered progress
 * rail, passed as `children`. Navigating remounts the page, so the drawer resets.
 */
export function MobileLessonBar({ pct, children }: { pct: number; children: React.ReactNode }) {
  const t = useTranslations('lesson');
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-14 z-20 -mx-4 mb-4 flex items-center gap-3 border-b bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
      <ProgressBar pct={pct} label={t('progressAria', { pct })} className="flex-1" />
      <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="outline" size="sm" />}>
          <Menu className="size-4" />
          {t('lessonsDrawer')}
        </SheetTrigger>
        <SheetContent side="left" className="w-80 max-w-[85vw] overflow-y-auto p-4">
          <SheetHeader className="p-0">
            <SheetTitle>{t('lessonsDrawer')}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{children}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
