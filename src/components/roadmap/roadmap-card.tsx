'use client';

import { ArrowUp, ArrowDown, Check, Circle, Clock, MoveRight, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { RoadmapItem } from '@/lib/data/types';
import { tl } from '@/lib/data/types';

const STATUS_NEXT: Record<RoadmapItem['status'], RoadmapItem['status']> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
};

export function RoadmapCard({
  item,
  grades,
  isFirst,
  isLast,
  onCycleStatus,
  onMove,
  onMoveGrade,
  onRemove,
}: {
  item: RoadmapItem;
  grades: number[];
  isFirst: boolean;
  isLast: boolean;
  onCycleStatus: (item: RoadmapItem) => void;
  onMove: (item: RoadmapItem, dir: -1 | 1) => void;
  onMoveGrade: (item: RoadmapItem, grade: number) => void;
  onRemove: (item: RoadmapItem) => void;
}) {
  const t = useTranslations('roadmap');
  const locale = useLocale();
  const StatusIcon = item.status === 'done' ? Check : item.status === 'in_progress' ? Clock : Circle;

  return (
    <div className="space-y-2 rounded-lg border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{tl(item.title, locale)}</p>
        <Button variant="ghost" size="icon-xs" aria-label={t('remove')} onClick={() => onRemove(item)}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {t(`kind.${item.kind}`)}
        </span>
        <button
          type="button"
          onClick={() => onCycleStatus(item)}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] transition-colors',
            item.status === 'done' ? 'text-brand' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <StatusIcon className="size-3" />
          {t(`status.${item.status}`)}
        </button>
      </div>

      <div className="flex items-center gap-1 border-t pt-2">
        <Button variant="ghost" size="icon-xs" aria-label={t('moveUp')} disabled={isFirst} onClick={() => onMove(item, -1)}>
          <ArrowUp className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-xs" aria-label={t('moveDown')} disabled={isLast} onClick={() => onMove(item, 1)}>
          <ArrowDown className="size-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={t('moveGrade', { grade: '' })} />}>
            <MoveRight className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {grades.filter((g) => g !== item.grade).map((g) => (
              <DropdownMenuItem key={g} onClick={() => onMoveGrade(item, g)}>
                {t('moveGrade', { grade: g })}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export { STATUS_NEXT };
