import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { Edit } from 'lucide-react';
import { db } from '@/lib/data/provider';
import { tl } from '@/lib/data/types';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { CourseForm } from '@/components/admin/course-form';
import { DeleteCourseButton, PublishCourseButton } from '@/components/admin/action-buttons';

export default async function AdminCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('admin');
  const tc = await getTranslations('courses');
  const activeLocale = await getLocale();
  const [courses, tags] = await Promise.all([db.adminListCourses(), db.getTags()]);
  const detailed = await Promise.all(courses.map((course) => db.adminGetCourse(course.id)));
  const counts = new Map(detailed.filter(Boolean).map((course) => [course!.id, course!.lessons.length]));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('courses.title')}</h1>
        <p className="text-muted-foreground">{t('courses.subtitle')}</p>
      </header>

      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-sm font-medium">{t('actions.newCourse')}</summary>
        <div className="mt-5 border-t pt-5">
          <CourseForm tags={tags} />
        </div>
      </details>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">{t('table.title')}</th>
              <th className="px-3 py-2 font-medium">{t('fields.subject')}</th>
              <th className="px-3 py-2 font-medium">{t('fields.difficulty')}</th>
              <th className="px-3 py-2 font-medium">{t('fields.lessons')}</th>
              <th className="px-3 py-2 font-medium">{t('fields.status')}</th>
              <th className="px-3 py-2 font-medium">{t('table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {courses.map((course) => (
              <tr key={course.id}>
                <td className="px-3 py-3 font-medium">{tl(course.title, activeLocale)}</td>
                <td className="px-3 py-3 text-muted-foreground">
                  {course.subject ? tc(`subjects.${course.subject}`) : '—'}
                </td>
                <td className="px-3 py-3 text-muted-foreground">{tc(`difficulty.${course.difficulty}`)}</td>
                <td className="px-3 py-3 text-muted-foreground tabular-nums">{counts.get(course.id) ?? 0}</td>
                <td className="px-3 py-3">
                  <span className="rounded-full border px-2 py-0.5 text-xs">
                    {course.is_published ? t('status.published') : t('status.draft')}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button nativeButton={false} variant="outline" size="sm" render={<Link href={`/admin/courses/${course.id}`} />}>
                      <Edit className="size-3.5" />
                      {t('actions.edit')}
                    </Button>
                    <PublishCourseButton id={course.id} published={course.is_published} />
                    <DeleteCourseButton id={course.id} />
                  </div>
                </td>
              </tr>
            ))}
            {courses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                  {t('empty.courses')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
