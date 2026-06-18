'use client';

import { useState, useTransition } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { upsertRoadmapItemAction } from '@/lib/personalization/actions';
import type { DraftItem } from '@/lib/assistant/types';

export function RoadmapDraftButton({ onAccepted }: { onAccepted: () => void }) {
  const locale = useLocale();
  const t = useTranslations('assistant');
  const tr = useTranslations('roadmap');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [fallback, setFallback] = useState(false);
  const [open, setOpen] = useState(false);
  const [drafting, startDrafting] = useTransition();
  const [accepting, startAccepting] = useTransition();

  function draft() {
    startDrafting(async () => {
      try {
        const res = await fetch('/api/assistant/roadmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale }),
        });
        if (!res.ok) throw new Error('draft failed');
        const data = (await res.json()) as { items: DraftItem[]; fallback: boolean };
        setItems(data.items);
        setFallback(data.fallback);
        setOpen(true);
      } catch {
        toast.error(t('error'));
      }
    });
  }

  function remove(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
  }

  function accept() {
    startAccepting(async () => {
      const positions: Record<number, number> = {};
      for (const item of items) {
        const position = positions[item.grade] ?? 0;
        positions[item.grade] = position + 1;
        const res = await upsertRoadmapItemAction({
          id: crypto.randomUUID(),
          grade: item.grade,
          kind: item.kind,
          ref_id: item.ref_id,
          title: item.title,
          status: 'todo',
          position,
        });
        if (!res.ok) {
          toast.error(tr('error'));
          return;
        }
      }
      toast.success(tr('generated'));
      setOpen(false);
      onAccepted();
    });
  }

  return (
    <>
      <Button variant="outline" onClick={draft} disabled={drafting}>
        <MessageCircle className="size-4" />
        <span className="hidden sm:inline">{drafting ? t('draft.drafting') : t('draft.button')}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('draft.title')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {fallback ? (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                {t('unavailable')} {t('fallback.roadmap')}
              </p>
            ) : null}

            <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div key={`${item.kind}:${item.ref_id}:${index}`} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {tr('grade', { grade: item.grade })} · {tr(`kind.${item.kind}`)}
                      </p>
                      {item.rationale ? (
                        <p className="text-xs text-muted-foreground">{item.rationale}</p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('draft.remove')}
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t('draft.cancel')}
              </Button>
              <Button onClick={accept} disabled={accepting || items.length === 0}>
                {t('draft.accept')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
