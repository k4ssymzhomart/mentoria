import { getLocale, getTranslations } from 'next-intl/server';
import type { Lesson } from '@/lib/data/types';
import { tl } from '@/lib/data/types';
import { Link } from '@/i18n/navigation';
import { LessonRowContent } from './lesson-row';

/** The enrolled outline: every row is a link to the player, with live status. */
export async function LessonList({
  slug,
  lessons,
  completedIds,
  currentId,
}: {
  slug: string;
  lessons: Lesson[];
  completedIds: Set<string>;
  currentId: string | null;
}) {
  const t = await getTranslations('lesson');
  const locale = await getLocale();

  return (
    <ol className="space-y-2">
      {lessons.map((l, i) => (
        <li key={l.id}>
          <Link
            href={`/courses/${slug}/lessons/${l.id}`}
            className="block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LessonRowContent
              n={i + 1}
              title={tl(l.title, locale)}
              contentType={l.content_type}
              typeLabel={t(`type.${l.content_type}`)}
              durationLabel={l.duration_min ? `${l.duration_min} ${t('min')}` : null}
              status={completedIds.has(l.id) ? 'completed' : 'todo'}
              current={l.id === currentId}
            />
          </Link>
        </li>
      ))}
    </ol>
  );
}
