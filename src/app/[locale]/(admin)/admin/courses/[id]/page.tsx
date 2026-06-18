import { notFound } from 'next/navigation';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/data/provider';
import { tl } from '@/lib/data/types';
import { Link } from '@/i18n/navigation';
import { CourseForm } from '@/components/admin/course-form';
import { LessonForm, QuizForm } from '@/components/admin/lesson-form';
import {
  DeleteLessonButton,
  DeleteQuizButton,
  MoveLessonButton,
} from '@/components/admin/action-buttons';

export default async function AdminCourseEditorPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('admin');
  const activeLocale = await getLocale();
  const [course, tags] = await Promise.all([db.adminGetCourse(id), db.getTags()]);
  if (!course) notFound();
  const lessonRefs = course.lessons.map((lesson) => ({ id: lesson.id }));

  return (
    <div className="space-y-8">
      <Link href="/admin/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        {t('courses.back')}
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{tl(course.title, activeLocale)}</h1>
        <p className="text-muted-foreground">{t('courses.editorSubtitle')}</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">{t('courses.meta')}</h2>
        <div className="rounded-lg border p-4">
          <CourseForm course={course} tags={tags} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{t('lessons.title')}</h2>
          <span className="text-sm text-muted-foreground">{t('lessons.count', { count: course.lessons.length })}</span>
        </div>

        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer text-sm font-medium">{t('actions.addLesson')}</summary>
          <div className="mt-5 border-t pt-5">
            <LessonForm courseId={course.id} nextPosition={course.lessons.length + 1} />
          </div>
        </details>

        <div className="space-y-3">
          {course.lessons.map((lesson, index) => (
            <details key={lesson.id} className="rounded-lg border p-4">
              <summary className="cursor-pointer">
                <span className="inline-flex items-center gap-3 text-sm font-medium">
                  <span className="tabular-nums text-muted-foreground">{lesson.position}.</span>
                  {tl(lesson.title, activeLocale)}
                  {lesson.quiz ? (
                    <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">{t('fields.quiz')}</span>
                  ) : null}
                </span>
              </summary>
              <div className="mt-4 space-y-6 border-t pt-5">
                <div className="flex flex-wrap gap-2">
                  <MoveLessonButton items={lessonRefs} index={index} direction={-1} />
                  <MoveLessonButton items={lessonRefs} index={index} direction={1} />
                  <DeleteLessonButton id={lesson.id} />
                </div>
                <LessonForm courseId={course.id} lesson={lesson} nextPosition={lesson.position} />
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium">{t('fields.quiz')}</h3>
                    {lesson.quiz ? <DeleteQuizButton id={lesson.quiz.id} /> : null}
                  </div>
                  <QuizForm lesson={lesson} />
                </div>
              </div>
            </details>
          ))}
          {course.lessons.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              {t('empty.lessons')}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
