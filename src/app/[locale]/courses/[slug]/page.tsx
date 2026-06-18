import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft, Check } from 'lucide-react';
import { db } from '@/lib/data/provider';
import { getAuthUserId, getSessionUser } from '@/lib/auth';
import { tl } from '@/lib/data/types';
import type { Tag } from '@/lib/data/types';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { nextIncompleteLesson } from '@/lib/courses/format';
import { ProgressBar } from '@/components/courses/progress-bar';
import { EnrollButton } from '@/components/courses/enroll-button';
import { LessonList } from '@/components/courses/lesson-list';
import { LockedOutline } from '@/components/courses/locked-outline';
import { AssistantEntryButton } from '@/components/assistant/assistant-entry';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const course = await db.getCourseBySlug(slug);
  return course ? { title: tl(course.title, locale) } : {};
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const course = await db.getCourseBySlug(slug);
  if (!course) notFound();

  const t = await getTranslations('courses');
  const ta = await getTranslations('assistant');
  const [tags, userId, session] = await Promise.all([db.getTags(), getAuthUserId(), getSessionUser()]);
  const tagMap = new Map(tags.map((tag: Tag) => [tag.slug, tag]));
  const lessons = course.lessons;
  const firstLessonId = lessons[0]?.id ?? null;

  // Enrollment + progress for the signed-in student.
  let enrolled = false;
  let completedIds = new Set<string>();
  let progress = { completed: 0, total: lessons.length, pct: 0 };
  let certificateSerial: string | null = null;
  if (userId) {
    const enrollments = await db.listEnrollments(userId);
    enrolled = enrollments.some((e) => e.course.id === course.id);
    if (enrolled) {
      const [ids, prog] = await Promise.all([
        db.getCompletedLessonIds(userId, course.id),
        db.getCourseProgress(userId, course.id),
      ]);
      completedIds = new Set(ids);
      progress = prog;
      if (prog.pct >= 100) {
        const certs = await db.listCertificates(userId);
        certificateSerial = certs.find((c) => c.course_id === course.id)?.serial ?? null;
      }
    }
  }

  const resumeId = nextIncompleteLesson(lessons, completedIds)?.id ?? firstLessonId;
  const completed = enrolled && progress.pct >= 100;
  const chips = course.tags.map((s) => tagMap.get(s)).filter((x): x is Tag => Boolean(x));

  const meta = [
    t(`difficulty.${course.difficulty}`),
    t('card.lessons', { count: lessons.length }),
    course.estimated_hours ? t('card.hours', { hours: course.estimated_hours }) : null,
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/courses"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t('detail.back')}
      </Link>

      <header className="mt-6 space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{tl(course.title, locale)}</h1>
        {course.summary ? <p className="text-muted-foreground">{tl(course.summary, locale)}</p> : null}
        <p className="text-sm text-muted-foreground">{meta.join(' · ')}</p>
        {chips.length ? (
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <span key={c.slug} className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                {tl(c.label, locale)}
              </span>
            ))}
          </div>
        ) : null}
        <div>
          <AssistantEntryButton
            label={ta('ask')}
            prompt={`${ta('ask')}: ${tl(course.title, locale)}`}
            context={{ kind: 'ask', itemType: 'course', itemId: course.id }}
            canAsk={Boolean(session)}
          />
        </div>
      </header>

      {/* Enrollment / progress panel */}
      <section className="mt-6 rounded-lg border bg-card p-5">
        {!enrolled ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{tl(course.title, locale)}</p>
              <p className="text-sm text-muted-foreground">{t('detail.freeSelfPaced')}</p>
            </div>
            <EnrollButton
              courseId={course.id}
              slug={course.slug}
              firstLessonId={firstLessonId}
              canEnroll={Boolean(userId)}
              label={t('detail.start')}
            />
          </div>
        ) : completed ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-center gap-2 font-medium">
              <Check className="size-5 text-brand" />
              {t('detail.completed')}
            </p>
            {certificateSerial ? (
              <Button nativeButton={false} render={<Link href={`/certificates/${certificateSerial}`} />}>
                {t('detail.viewCertificate')}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground tabular-nums">
                {t('detail.progressSummary', {
                  completed: progress.completed,
                  total: progress.total,
                  pct: progress.pct,
                })}
              </span>
              {resumeId ? (
                <Button nativeButton={false} render={<Link href={`/courses/${slug}/lessons/${resumeId}`} />}>
                  {t('detail.continue')}
                </Button>
              ) : null}
            </div>
            <ProgressBar pct={progress.pct} label={t('detail.progressSummary', {
              completed: progress.completed,
              total: progress.total,
              pct: progress.pct,
            })} />
          </div>
        )}
      </section>

      {course.description ? (
        <section className="mt-8 space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {t('detail.description')}
          </h2>
          <p className="whitespace-pre-line leading-relaxed">{tl(course.description, locale)}</p>
        </section>
      ) : null}

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t('detail.outline')}
        </h2>
        {lessons.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t('detail.comingSoon')}
          </p>
        ) : enrolled ? (
          <LessonList slug={slug} lessons={lessons} completedIds={completedIds} currentId={resumeId} />
        ) : (
          <LockedOutline
            rows={lessons.map((l) => ({
              id: l.id,
              title: tl(l.title, locale),
              contentType: l.content_type,
              duration: l.duration_min,
            }))}
            courseId={course.id}
            slug={course.slug}
            firstLessonId={firstLessonId}
            canEnroll={Boolean(userId)}
          />
        )}
      </section>
    </div>
  );
}
