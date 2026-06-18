'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { ProgressBar } from '@/components/courses/progress-bar';
import type { RoadmapItem } from '@/lib/data/types';
import {
  upsertRoadmapItemAction,
  deleteRoadmapItemAction,
} from '@/lib/personalization/actions';
import { RoadmapCard, STATUS_NEXT } from './roadmap-card';
import { AddItemDialog, type CatalogOption } from './add-item-dialog';
import { RoadmapDraftButton } from './roadmap-draft-button';

const GRADES = [9, 10, 11, 12];

export function RoadmapBoard({
  initialItems,
  courses,
  opportunities,
}: {
  initialItems: RoadmapItem[];
  courses: CatalogOption[];
  opportunities: CatalogOption[];
}) {
  const t = useTranslations('roadmap');
  const router = useRouter();
  const [items, setItems] = useState<RoadmapItem[]>(initialItems);
  const [addOpen, setAddOpen] = useState(false);

  const persist = (item: RoadmapItem) =>
    upsertRoadmapItemAction(item).then((r) => { if (!r.ok) toast.error(t('error')); });

  const lane = (g: number) => items.filter((i) => i.grade === g).sort((a, b) => a.position - b.position);

  function cycleStatus(item: RoadmapItem) {
    const updated = { ...item, status: STATUS_NEXT[item.status] };
    setItems((xs) => xs.map((i) => (i.id === item.id ? updated : i)));
    persist(updated);
  }

  function remove(item: RoadmapItem) {
    setItems((xs) => xs.filter((i) => i.id !== item.id));
    deleteRoadmapItemAction(item.id).then((r) => { if (!r.ok) toast.error(t('error')); });
  }

  function move(item: RoadmapItem, dir: -1 | 1) {
    const l = lane(item.grade);
    const idx = l.findIndex((i) => i.id === item.id);
    const j = idx + dir;
    if (j < 0 || j >= l.length) return;
    const a = l[idx], b = l[j];
    const ua = { ...a, position: b.position };
    const ub = { ...b, position: a.position };
    setItems((xs) => xs.map((i) => (i.id === a.id ? ua : i.id === b.id ? ub : i)));
    persist(ua);
    persist(ub);
  }

  function moveGrade(item: RoadmapItem, grade: number) {
    const position = lane(grade).length;
    const updated = { ...item, grade, position };
    setItems((xs) => xs.map((i) => (i.id === item.id ? updated : i)));
    persist(updated);
  }

  function add({ kind, ref_id, title, grade }: { kind: RoadmapItem['kind']; ref_id: string | null; title: Record<string, string>; grade: number }) {
    const item: RoadmapItem = {
      id: crypto.randomUUID(),
      grade,
      position: lane(grade).length,
      kind,
      ref_id,
      title: title as RoadmapItem['title'],
      status: 'todo',
    };
    setItems((xs) => [...xs, item]);
    persist(item);
  }

  const empty = items.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        {!empty ? (
          <div className="flex gap-2">
            <RoadmapDraftButton onAccepted={() => router.refresh()} />
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">{t('add')}</span>
            </Button>
          </div>
        ) : null}
      </div>

      {empty ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
          <div className="space-y-1">
            <p className="font-medium">{t('empty.title')}</p>
            <p className="max-w-sm text-sm text-muted-foreground">{t('empty.subtitle')}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <RoadmapDraftButton onAccepted={() => router.refresh()} />
            <Button variant="outline" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              {t('addManually')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {GRADES.map((g) => {
            const l = lane(g);
            const done = l.filter((i) => i.status === 'done').length;
            const pct = l.length ? Math.round((done / l.length) * 100) : 0;
            return (
              <div key={g} className="space-y-3 rounded-lg bg-muted/30 p-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{t('grade', { grade: g })}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {t('progress', { done, total: l.length })}
                    </span>
                  </div>
                  <ProgressBar pct={pct} />
                </div>
                <div className="space-y-2">
                  {l.length ? (
                    l.map((item, i) => (
                      <RoadmapCard
                        key={item.id}
                        item={item}
                        grades={GRADES}
                        isFirst={i === 0}
                        isLast={i === l.length - 1}
                        onCycleStatus={cycleStatus}
                        onMove={move}
                        onMoveGrade={moveGrade}
                        onRemove={remove}
                      />
                    ))
                  ) : (
                    <p className="px-1 py-4 text-center text-xs text-muted-foreground">{t('laneEmpty')}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        courses={courses}
        opportunities={opportunities}
        grades={GRADES}
        onAdd={add}
      />
    </div>
  );
}
