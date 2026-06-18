'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { RoadmapItem } from '@/lib/data/types';

export type CatalogOption = { id: string; label: string; title: Record<string, string> };
type Kind = RoadmapItem['kind'];

export function AddItemDialog({
  open,
  onOpenChange,
  courses,
  opportunities,
  grades,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: CatalogOption[];
  opportunities: CatalogOption[];
  grades: number[];
  onAdd: (item: { kind: Kind; ref_id: string | null; title: Record<string, string>; grade: number }) => void;
}) {
  const t = useTranslations('roadmap');
  const [kind, setKind] = useState<Kind>('course');
  const [grade, setGrade] = useState(grades[0]);
  const [query, setQuery] = useState('');
  const [milestone, setMilestone] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const options = kind === 'course' ? courses : opportunities;
  const filtered = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase())),
    [options, query],
  );

  function reset() {
    setKind('course');
    setQuery('');
    setMilestone('');
    setSelectedId(null);
    setGrade(grades[0]);
  }

  function submit() {
    if (kind === 'milestone') {
      const text = milestone.trim();
      if (!text) return;
      onAdd({ kind, ref_id: null, title: { en: text, ru: text, kk: text }, grade });
    } else {
      const opt = options.find((o) => o.id === selectedId);
      if (!opt) return;
      onAdd({ kind, ref_id: opt.id, title: opt.title, grade });
    }
    reset();
    onOpenChange(false);
  }

  const canAdd = kind === 'milestone' ? milestone.trim().length > 0 : Boolean(selectedId);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('add_dialog.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Kind */}
          <div className="flex rounded-lg border p-0.5">
            {(['course', 'opportunity', 'milestone'] as Kind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => { setKind(k); setSelectedId(null); }}
                className={cn('flex-1 rounded-md px-2 py-1.5 text-xs transition-colors', kind === k ? 'bg-muted font-medium' : 'text-muted-foreground')}
              >
                {t(`kind.${k}`)}
              </button>
            ))}
          </div>

          {/* Picker */}
          {kind === 'milestone' ? (
            <Input
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
              placeholder={t('add_dialog.milestonePlaceholder')}
              aria-label={t('add_dialog.milestoneLabel')}
            />
          ) : (
            <div className="space-y-2">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('add_dialog.search')} />
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {filtered.length ? (
                  filtered.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setSelectedId(o.id)}
                      className={cn(
                        'block w-full truncate rounded-md border px-3 py-2 text-left text-sm transition-colors',
                        selectedId === o.id ? 'border-foreground bg-muted/50' : 'border-border hover:border-foreground/30',
                      )}
                    >
                      {o.label}
                    </button>
                  ))
                ) : (
                  <p className="px-1 py-2 text-sm text-muted-foreground">{t('add_dialog.noResults')}</p>
                )}
              </div>
            </div>
          )}

          {/* Grade */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">{t('add_dialog.grade')}</p>
            <div className="flex gap-2">
              {grades.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={cn(
                    'size-9 rounded-md border text-sm transition-colors',
                    grade === g ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/40',
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
              {t('add_dialog.cancel')}
            </Button>
            <Button onClick={submit} disabled={!canAdd}>
              {t('add_dialog.add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
