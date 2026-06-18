'use client';

import { X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Tag } from '@/lib/data/types';
import { tl } from '@/lib/data/types';
import { useDiscovery } from './use-discovery';

export function ActiveFilters({ tags }: { tags: Tag[] }) {
  const t = useTranslations('opportunities');
  const locale = useLocale();
  const { sp, toggleInList, setParam, clearAll } = useDiscovery();
  const tagMap = new Map(tags.map((x) => [x.slug, x]));

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  const q = sp.get('q')?.trim();
  if (q) chips.push({ key: 'q', label: `“${q}”`, onRemove: () => setParam('q', null) });

  for (const v of sp.get('type')?.split(',').filter(Boolean) ?? [])
    chips.push({ key: `type:${v}`, label: t(`types.${v}`), onRemove: () => toggleInList('type', v) });
  for (const v of sp.get('format')?.split(',').filter(Boolean) ?? [])
    chips.push({ key: `format:${v}`, label: t(`formats.${v}`), onRemove: () => toggleInList('format', v) });
  for (const v of sp.get('tags')?.split(',').filter(Boolean) ?? [])
    chips.push({
      key: `tag:${v}`,
      label: tagMap.has(v) ? tl(tagMap.get(v)!.label, locale) : v,
      onRemove: () => toggleInList('tags', v),
    });

  const grade = sp.get('grade');
  if (grade) chips.push({ key: 'grade', label: `${t('filters.grade')} ${grade}`, onRemove: () => setParam('grade', null) });

  const dl = sp.get('deadline');
  if (dl && dl !== 'all')
    chips.push({
      key: 'deadline',
      label: dl === '30' ? t('filters.deadline30') : t('filters.deadline90'),
      onRemove: () => setParam('deadline', null),
    });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.onRemove}
          aria-label={`${t('card.removeFilter')}: ${c.label}`}
          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          {c.label}
          <X className="size-3" />
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground"
      >
        {t('filters.clearAll')}
      </button>
    </div>
  );
}
