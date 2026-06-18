import { getLocale, getTranslations } from 'next-intl/server';
import { Check } from 'lucide-react';
import type { Course, Tag } from '@/lib/data/types';
import { tl } from '@/lib/data/types';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CourseCover } from './course-cover';
import { ProgressBar } from './progress-bar';
import { EnrollButton } from './enroll-button';

export type CardEnrollment = {
  pct: number;
  completed: number;
  total: number;
  resumeLessonId: string | null;
};

export async function CourseCard({
  course,
  lessonCount,
  estimatedHours,
  firstLessonId,
  tagMap,
  enrollment,
  canEnroll,
}: {
  course: Course;
  lessonCount: number;
  estimatedHours: number | null;
  firstLessonId: string | null;
  tagMap: Map<string, Tag>;
  enrollment: CardEnrollment | null;
  canEnroll: boolean;
}) {
  const t = await getTranslations('courses');
  const locale = await getLocale();

  const chips = course.tags
    .map((s) => tagMap.get(s))
    .filter((x): x is Tag => Boolean(x))
    .slice(0, 2);

  const completed = enrollment ? enrollment.pct >= 100 : false;
  const resume = enrollment?.resumeLessonId ?? firstLessonId;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-md border border-border bg-card transition-all duration-150 hover:-translate-y-0.5 hover:border-foreground/40 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
      <CourseCover coverUrl={course.cover_url} title={tl(course.title, locale)} seed={course.slug} />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline">{t(`difficulty.${course.difficulty}`)}</Badge>
          {completed ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
              <Check className="size-3.5" />
              {t('card.completed')}
            </span>
          ) : null}
        </div>

        <Link
          href={`/courses/${course.slug}`}
          className="after:absolute after:inset-0 focus:outline-none"
        >
          <h3 className="line-clamp-2 font-semibold tracking-tight">{tl(course.title, locale)}</h3>
        </Link>

        {course.summary ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{tl(course.summary, locale)}</p>
        ) : null}

        <div className="mt-auto space-y-3 pt-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{t('card.lessons', { count: lessonCount })}</span>
            {estimatedHours ? <span>· {t('card.hours', { hours: estimatedHours })}</span> : null}
            {chips.map((c) => (
              <span key={c.slug} className="rounded-full border px-2 py-0.5">
                {tl(c.label, locale)}
              </span>
            ))}
          </div>

          {enrollment && !completed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                <span>{t('detail.progressSummary', {
                  completed: enrollment.completed,
                  total: enrollment.total,
                  pct: enrollment.pct,
                })}</span>
              </div>
              <ProgressBar pct={enrollment.pct} />
            </div>
          ) : null}

          {/* Primary action sits above the card's full-cover link (z-10). */}
          <div className="relative z-10">
            {enrollment ? (
              <Button
                nativeButton={false}
                variant="outline"
                size="sm"
                className="w-full"
                render={<Link href={`/courses/${course.slug}/lessons/${resume ?? ''}`} />}
              >
                {completed ? t('card.review') : t('card.continue')}
              </Button>
            ) : (
              <EnrollButton
                courseId={course.id}
                slug={course.slug}
                firstLessonId={firstLessonId}
                canEnroll={canEnroll}
                size="sm"
                className="w-full"
                label={t('card.start')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
