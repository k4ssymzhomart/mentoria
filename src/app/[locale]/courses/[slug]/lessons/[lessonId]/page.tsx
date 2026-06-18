import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/data/provider';
import { requireUser, getAuthUserId } from '@/lib/auth';
import { tl } from '@/lib/data/types';
import { Link } from '@/i18n/navigation';
import { VideoEmbed } from '@/components/courses/video-embed';
import { LessonBody } from '@/components/courses/lesson-body';
import { MaterialsList } from '@/components/courses/materials-list';
import { CourseProgressRail } from '@/components/courses/course-progress-rail';
import { MobileLessonBar } from '@/components/courses/mobile-lesson-bar';
import { LessonBottom } from '@/components/courses/lesson-bottom';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; lessonId: string }>;
}): Promise<Metadata> {
  const { locale, slug, lessonId } = await params;
  const lesson = await db.getLessonForLearner(slug, lessonId);
  return lesson ? { title: tl(lesson.title, locale) } : {};
}

export default async function LessonPlayerPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; lessonId: string }>;
}) {
  const { locale, slug, lessonId } = await params;
  setRequestLocale(locale);
  await requireUser(); // Phase 0 guard: signed-out → home

  const [course, lesson, userId] = await Promise.all([
    db.getCourseBySlug(slug),
    db.getLessonForLearner(slug, lessonId),
    getAuthUserId(),
  ]);
  if (!course || !lesson) notFound();

  const t = await getTranslations('lesson');
  const lessons = course.lessons;
  const index = lessons.findIndex((l) => l.id === lessonId);
  const prev = index > 0 ? lessons[index - 1] : null;
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;
  const isLast = index === lessons.length - 1;

  // Auto-enroll on entry (idempotent) for demo smoothness, then read live progress.
  let completedIds = new Set<string>();
  let pct = 0;
  if (userId) {
    await db.enroll(userId, course.id);
    const [ids, prog] = await Promise.all([
      db.getCompletedLessonIds(userId, course.id),
      db.getCourseProgress(userId, course.id),
    ]);
    completedIds = new Set(ids);
    pct = prog.pct;
  }

  const materials = (lesson.materials ?? []).map((m) => ({ label: tl(m.label, locale), url: m.url }));
  const bodyText = tl(lesson.body, locale);
  const isVideo = lesson.content_type === 'video' && Boolean(lesson.video_url);

  const rail = (
    <CourseProgressRail
      slug={slug}
      title={tl(course.title, locale)}
      lessons={lessons}
      completedIds={completedIds}
      currentId={lessonId}
      pct={pct}
    />
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <MobileLessonBar pct={pct}>{rail}</MobileLessonBar>

      <div className="flex gap-8">
        <div className="min-w-0 flex-1 space-y-6">
          <div className="space-y-2">
            <Link
              href={`/courses/${slug}`}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              {tl(course.title, locale)}
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tl(lesson.title, locale)}</h1>
          </div>

          {isVideo ? <VideoEmbed url={lesson.video_url!} title={t('videoTitle')} /> : null}

          {bodyText ? <LessonBody text={bodyText} /> : null}

          <MaterialsList items={materials} heading={t('materials')} />

          <LessonBottom
            courseId={course.id}
            lessonId={lessonId}
            quiz={lesson.quiz}
            initiallyCompleted={completedIds.has(lessonId)}
            isLast={isLast}
            prevHref={prev ? `/courses/${slug}/lessons/${prev.id}` : null}
            nextHref={next ? `/courses/${slug}/lessons/${next.id}` : null}
          />
        </div>

        <aside className="hidden w-[300px] shrink-0 lg:block">
          <div className="sticky top-20">{rail}</div>
        </aside>
      </div>
    </div>
  );
}
