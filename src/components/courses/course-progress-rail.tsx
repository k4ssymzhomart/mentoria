import { getLocale, getTranslations } from 'next-intl/server';
import { Check, Circle } from 'lucide-react';
import type { Lesson } from '@/lib/data/types';
import { tl } from '@/lib/data/types';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { ProgressBar } from './progress-bar';

/**
 * The student's sense of place and momentum: course title, an accent progress
 * bar with NN%, and every lesson as a jump link with an accent check when done
 * and the current lesson highlighted. Rendered both in the desktop sticky
 * sidebar and inside the mobile "Lessons" drawer.
 */
export async function CourseProgressRail({
  slug,
  title,
  lessons,
  completedIds,
  currentId,
  pct,
}: {
  slug: string;
  title: string;
  lessons: Lesson[];
  completedIds: Set<string>;
  currentId: string;
  pct: number;
}) {
  const t = await getTranslations('lesson');
  const locale = await getLocale();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Link href={`/courses/${slug}`} className="block truncate text-sm font-medium hover:underline">
          {title}
        </Link>
        <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
          <span>{t('progressAria', { pct })}</span>
          <span>{pct}%</span>
        </div>
        <ProgressBar pct={pct} label={t('progressAria', { pct })} />
      </div>

      <ol className="space-y-0.5">
        {lessons.map((l, i) => {
          const done = completedIds.has(l.id);
          const current = l.id === currentId;
          return (
            <li key={l.id}>
              <Link
                href={`/courses/${slug}/lessons/${l.id}`}
                aria-current={current ? 'true' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                  current ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/60',
                )}
              >
                {done ? (
                  <Check className="size-4 shrink-0 text-brand" aria-hidden />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground/40" aria-hidden />
                )}
                <span className="w-4 shrink-0 text-center text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                <span className="truncate">{tl(l.title, locale)}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
