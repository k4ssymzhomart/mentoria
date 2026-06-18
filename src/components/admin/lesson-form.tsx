'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveLessonAction, saveQuizAction } from '@/lib/admin/actions';
import type { LessonWithQuiz } from '@/lib/data/types';
import { AdminForm } from './form-shell';
import { LocalizedField } from './localized-field';

export function LessonForm({
  courseId,
  lesson,
  nextPosition,
}: {
  courseId: string;
  lesson?: LessonWithQuiz | null;
  nextPosition: number;
}) {
  const t = useTranslations('admin');

  return (
    <AdminForm action={saveLessonAction}>
      <input type="hidden" name="course_id" value={courseId} />
      {lesson?.id ? <input type="hidden" name="id" value={lesson.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`lesson-position-${lesson?.id ?? 'new'}`}>{t('fields.position')}</Label>
          <Input id={`lesson-position-${lesson?.id ?? 'new'}`} name="position" type="number" min={1} defaultValue={lesson?.position ?? nextPosition} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`lesson-type-${lesson?.id ?? 'new'}`}>{t('fields.contentType')}</Label>
          <select
            id={`lesson-type-${lesson?.id ?? 'new'}`}
            name="content_type"
            defaultValue={lesson?.content_type ?? 'text'}
            className="h-8 w-full rounded-lg border bg-background px-2 text-sm"
          >
            <option value="text">{t('contentType.text')}</option>
            <option value="video">{t('contentType.video')}</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`lesson-duration-${lesson?.id ?? 'new'}`}>{t('fields.duration')}</Label>
          <Input id={`lesson-duration-${lesson?.id ?? 'new'}`} name="duration_min" type="number" min={1} defaultValue={lesson?.duration_min ?? ''} />
        </div>
      </div>

      <LocalizedField name="title" label={t('fields.title')} value={lesson?.title} />
      <LocalizedField name="body" label={t('fields.body')} value={lesson?.body} multiline rows={6} />

      <div className="space-y-2">
        <Label htmlFor={`lesson-video-${lesson?.id ?? 'new'}`}>{t('fields.videoUrl')}</Label>
        <Input id={`lesson-video-${lesson?.id ?? 'new'}`} name="video_url" type="url" defaultValue={lesson?.video_url ?? ''} />
      </div>

      <fieldset className="space-y-3 rounded-lg border p-3">
        <legend className="px-1 text-sm font-medium">{t('fields.materials')}</legend>
        {[0, 1, 2].map((i) => {
          const material = lesson?.materials?.[i];
          return (
            <div key={i} className="grid gap-3 border-t pt-3 first:border-t-0 first:pt-0 lg:grid-cols-[1fr_1fr]">
              <LocalizedField name={`material_${i}_label`} label={t('fields.materialLabel', { n: i + 1 })} value={material?.label} />
              <div className="space-y-2">
                <Label htmlFor={`material-url-${lesson?.id ?? 'new'}-${i}`}>{t('fields.materialUrl')}</Label>
                <Input id={`material-url-${lesson?.id ?? 'new'}-${i}`} name={`material_${i}_url`} type="url" defaultValue={material?.url ?? ''} />
              </div>
            </div>
          );
        })}
      </fieldset>
    </AdminForm>
  );
}

export function QuizForm({ lesson }: { lesson: LessonWithQuiz }) {
  const t = useTranslations('admin');
  const quiz = lesson.quiz;
  const questions = quiz?.questions ?? [];

  return (
    <AdminForm action={saveQuizAction}>
      <input type="hidden" name="lesson_id" value={lesson.id} />
      {quiz?.id ? <input type="hidden" name="id" value={quiz.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
        <LocalizedField name="title" label={t('fields.quizTitle')} value={quiz?.title} />
        <div className="space-y-2">
          <Label htmlFor={`passing-${lesson.id}`}>{t('fields.passingScore')}</Label>
          <Input id={`passing-${lesson.id}`} name="passing_score" type="number" min={1} max={100} defaultValue={quiz?.passing_score ?? 70} />
        </div>
      </div>

      <div className="space-y-4">
        {[0, 1, 2].map((qi) => {
          const question = questions[qi];
          return (
            <fieldset key={qi} className="space-y-3 rounded-lg border p-3">
              <legend className="px-1 text-sm font-medium">{t('fields.question', { n: qi + 1 })}</legend>
              <LocalizedField name={`q_${qi}_prompt`} label={t('fields.prompt')} value={question?.prompt} />
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((oi) => {
                  const option = question?.options?.[oi];
                  return (
                    <div key={oi} className="space-y-2 rounded-md border p-3">
                      <LocalizedField name={`q_${qi}_o_${oi}`} label={t('fields.option', { n: oi + 1 })} value={option?.label} />
                      <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="radio"
                          name={`q_${qi}_correct`}
                          value={`o${oi + 1}`}
                          defaultChecked={(question?.correct ?? 'o1') === `o${oi + 1}`}
                        />
                        {t('fields.correct')}
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    </AdminForm>
  );
}
