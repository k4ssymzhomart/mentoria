import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/data/provider';
import { getAuthUserId } from '@/lib/auth';
import type { Tag } from '@/lib/data/types';
import { nextIncompleteLesson } from '@/lib/courses/format';
import { CatalogFilters } from '@/components/courses/catalog-filters';
import { CourseCard, type CardEnrollment } from '@/components/courses/course-card';
import { CourseGridSkeleton } from '@/components/courses/course-card-skeleton';

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function CourseGrid({
  subject,
  difficulty,
}: {
  subject?: string;
  difficulty?: string;
}) {
  const t = await getTranslations('courses');
  const [base, userId, tags] = await Promise.all([
    db.listCourses(),
    getAuthUserId(),
    db.getTags(),
  ]);
  const tagMap = new Map(tags.map((tag: Tag) => [tag.slug, tag]));

  // Lessons per course drive counts and the "next incomplete" resume target.
  const detailed = (await Promise.all(base.map((c) => db.getCourseBySlug(c.slug)))).filter(
    (c): c is NonNullable<typeof c> => Boolean(c),
  );

  const filtered = detailed.filter(
    (c) =>
      (!subject || c.subject === subject) &&
      (!difficulty || c.difficulty === difficulty),
  );

  // Per-course enrollment (progress + resume point) for the signed-in student.
  const enrollmentByCourse = new Map<string, CardEnrollment>();
  if (userId) {
    const enrollments = await db.listEnrollments(userId);
    await Promise.all(
      enrollments.map(async (e) => {
        const course = detailed.find((c) => c.id === e.course.id);
        if (!course) return;
        const completedIds = await db.getCompletedLessonIds(userId, course.id);
        enrollmentByCourse.set(course.id, {
          pct: e.pct,
          completed: e.completed,
          total: e.total,
          resumeLessonId: nextIncompleteLesson(course.lessons, completedIds)?.id ?? null,
        });
      }),
    );
  }

  if (filtered.length === 0) {
    return <p className="py-16 text-center text-sm text-muted-foreground">{t('empty')}</p>;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((c) => (
        <CourseCard
          key={c.id}
          course={c}
          lessonCount={c.lessons.length}
          estimatedHours={c.estimated_hours}
          firstLessonId={c.lessons[0]?.id ?? null}
          tagMap={tagMap}
          enrollment={enrollmentByCourse.get(c.id) ?? null}
          canEnroll={Boolean(userId)}
        />
      ))}
    </div>
  );
}

export default async function CoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const subject = first(sp.subject);
  const difficulty = first(sp.difficulty);

  const t = await getTranslations('courses');
  const base = await db.listCourses();
  const subjects = [...new Set(base.map((c) => c.subject).filter((s): s is string => Boolean(s)))];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <CatalogFilters subjects={subjects} />
      </header>

      <div className="mt-6">
        <Suspense key={`${subject ?? ''}-${difficulty ?? ''}`} fallback={<CourseGridSkeleton />}>
          <CourseGrid subject={subject} difficulty={difficulty} />
        </Suspense>
      </div>
    </div>
  );
}
