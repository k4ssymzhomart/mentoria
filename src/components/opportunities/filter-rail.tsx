'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Tag } from '@/lib/data/types';
import { tl } from '@/lib/data/types';
import { cn } from '@/lib/utils';
import { useDiscovery } from './use-discovery';

const TYPES = [
  'olympiad', 'hackathon', 'scholarship', 'internship', 'summer_school',
  'research', 'volunteering', 'competition', 'conference',
] as const;
const FORMATS = ['online', 'offline', 'hybrid'] as const;
const GRADES = [8, 9, 10, 11] as const;
const DEADLINES = ['all', '30', '90'] as const;

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1 text-sm transition-colors',
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function FilterRail({
  tags,
  myGrade,
}: {
  tags: Tag[];
  myGrade?: number | null;
}) {
  const t = useTranslations('opportunities');
  const locale = useLocale();
  const { sp, toggleInList, setParam, clearAll, has } = useDiscovery();

  const directions = tags.filter((x) => x.kind === 'direction');
  const subjects = tags.filter((x) => x.kind === 'subject');
  const grade = sp.get('grade');
  const deadline = sp.get('deadline') ?? 'all';

  const activeCount =
    (sp.get('q')?.trim() ? 1 : 0) +
    (sp.get('type')?.split(',').filter(Boolean).length ?? 0) +
    (sp.get('format')?.split(',').filter(Boolean).length ?? 0) +
    (sp.get('tags')?.split(',').filter(Boolean).length ?? 0) +
    (grade ? 1 : 0) +
    (deadline !== 'all' ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight">
          {t('filters.title')}
          {activeCount > 0 ? (
            <span className="ml-2 font-normal text-muted-foreground">
              {t('filters.active', { count: activeCount })}
            </span>
          ) : null}
        </h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground"
          >
            {t('filters.clearAll')}
          </button>
        ) : null}
      </div>

      <Section title={t('filters.type')}>
        {TYPES.map((v) => (
          <Chip key={v} active={has('type', v)} onClick={() => toggleInList('type', v)}>
            {t(`types.${v}`)}
          </Chip>
        ))}
      </Section>

      <Section title={t('filters.format')}>
        {FORMATS.map((v) => (
          <Chip key={v} active={has('format', v)} onClick={() => toggleInList('format', v)}>
            {t(`formats.${v}`)}
          </Chip>
        ))}
      </Section>

      <Section title={t('filters.direction')}>
        {directions.map((tag) => (
          <Chip key={tag.slug} active={has('tags', tag.slug)} onClick={() => toggleInList('tags', tag.slug)}>
            {tl(tag.label, locale)}
          </Chip>
        ))}
      </Section>

      <Section title={t('filters.subject')}>
        {subjects.map((tag) => (
          <Chip key={tag.slug} active={has('tags', tag.slug)} onClick={() => toggleInList('tags', tag.slug)}>
            {tl(tag.label, locale)}
          </Chip>
        ))}
      </Section>

      <Section title={t('filters.grade')}>
        {myGrade ? (
          <Chip active={grade === String(myGrade)} onClick={() => setParam('grade', String(myGrade))}>
            {t('filters.myGrade')} · {myGrade}
          </Chip>
        ) : null}
        {GRADES.map((g) => (
          <Chip
            key={g}
            active={grade === String(g)}
            onClick={() => setParam('grade', grade === String(g) ? null : String(g))}
          >
            {g}
          </Chip>
        ))}
      </Section>

      <Section title={t('filters.deadline')}>
        {DEADLINES.map((d) => (
          <Chip
            key={d}
            active={deadline === d}
            onClick={() => setParam('deadline', d === 'all' ? null : d)}
          >
            {d === 'all' ? t('filters.deadlineAny') : d === '30' ? t('filters.deadline30') : t('filters.deadline90')}
          </Chip>
        ))}
      </Section>
    </div>
  );
}
