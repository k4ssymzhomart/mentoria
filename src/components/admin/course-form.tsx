'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCourseAction, saveCourseAction } from '@/lib/admin/actions';
import { tl } from '@/lib/data/types';
import type { Course, CourseDifficulty, Tag } from '@/lib/data/types';
import { AdminForm } from './form-shell';
import { LocalizedField } from './localized-field';

const difficulties: CourseDifficulty[] = ['beginner', 'intermediate', 'advanced'];
const subjects = ['sat', 'ielts', 'admissions'] as const;

function Fields({ course, tags }: { course?: Course | null; tags: Tag[] }) {
  const t = useTranslations('admin');
  const tc = useTranslations('courses');
  const locale = useLocale();
  const selected = new Set(course?.tags ?? []);

  return (
    <>
      {course?.id ? <input type="hidden" name="id" value={course.id} /> : null}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="course-slug">{t('fields.slug')}</Label>
          <Input id="course-slug" name="slug" required defaultValue={course?.slug ?? ''} placeholder="new-course-slug" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="course-hours">{t('fields.estimatedHours')}</Label>
          <Input id="course-hours" name="estimated_hours" type="number" min={1} defaultValue={course?.estimated_hours ?? ''} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <LocalizedField name="title" label={t('fields.title')} value={course?.title} />
        <LocalizedField name="summary" label={t('fields.summary')} value={course?.summary} />
      </div>
      <LocalizedField name="description" label={t('fields.description')} value={course?.description} multiline rows={5} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="course-subject">{t('fields.subject')}</Label>
          <select id="course-subject" name="subject" defaultValue={course?.subject ?? 'admissions'} className="h-8 w-full rounded-lg border bg-background px-2 text-sm">
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {tc(`subjects.${subject}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="course-difficulty">{t('fields.difficulty')}</Label>
          <select id="course-difficulty" name="difficulty" defaultValue={course?.difficulty ?? 'beginner'} className="h-8 w-full rounded-lg border bg-background px-2 text-sm">
            {difficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {tc(`difficulty.${difficulty}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cover-url">{t('fields.coverUrl')}</Label>
          <Input id="cover-url" name="cover_url" type="url" defaultValue={course?.cover_url ?? ''} />
        </div>
      </div>

      <fieldset className="space-y-3 rounded-lg border p-3">
        <legend className="px-1 text-sm font-medium">{t('fields.tags')}</legend>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <label key={tag.slug} className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs">
              <input type="checkbox" name="tags" value={tag.slug} defaultChecked={selected.has(tag.slug)} />
              {tl(tag.label, locale)}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_published" defaultChecked={course?.is_published ?? false} />
        {t('fields.published')}
      </label>
    </>
  );
}

export function CourseForm({ course, tags }: { course?: Course | null; tags: Tag[] }) {
  const t = useTranslations('admin');
  if (course) {
    return (
      <AdminForm action={saveCourseAction}>
        <Fields course={course} tags={tags} />
      </AdminForm>
    );
  }

  return (
    <form action={createCourseAction} className="space-y-5">
      <Fields tags={tags} />
      <Button type="submit">
        <Save className="size-4" />
        {t('actions.createCourse')}
      </Button>
    </form>
  );
}
