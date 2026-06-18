'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { SignInDialog } from '@/components/shell/sign-in-dialog';
import { useRouter } from '@/i18n/navigation';
import { enrollAction } from '@/lib/courses/actions';
import { LessonRowContent } from './lesson-row';

type Row = { id: string; title: string; contentType: 'text' | 'video'; duration: number | null };

/**
 * Locked preview of the outline (visitor / not-enrolled). Every row is visible
 * but non-navigable; clicking any row runs the same enroll/sign-in path as the
 * panel's "Start course" — so a curious viewer is never dead-ended.
 */
export function LockedOutline({
  rows,
  courseId,
  slug,
  firstLessonId,
  canEnroll,
}: {
  rows: Row[];
  courseId: string;
  slug: string;
  firstLessonId: string | null;
  canEnroll: boolean;
}) {
  const t = useTranslations('lesson');
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  const lessonPath = firstLessonId
    ? `/courses/${slug}/lessons/${firstLessonId}`
    : `/courses/${slug}`;

  function onActivate() {
    if (!canEnroll) {
      setDialogOpen(true);
      return;
    }
    start(async () => {
      const res = await enrollAction(courseId);
      if (res.ok) router.push(lessonPath);
      else if (res.reason === 'auth') setDialogOpen(true);
      else toast.error(t('saveError'));
    });
  }

  return (
    <>
      <ol className="space-y-2">
        {rows.map((r, i) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={onActivate}
              disabled={pending}
              aria-label={`${t('locked')}: ${r.title}`}
              className="block w-full rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LessonRowContent
                n={i + 1}
                title={r.title}
                contentType={r.contentType}
                typeLabel={t(`type.${r.contentType}`)}
                durationLabel={r.duration ? `${r.duration} ${t('min')}` : null}
                status="locked"
              />
            </button>
          </li>
        ))}
      </ol>

      {!canEnroll ? (
        <SignInDialog open={dialogOpen} onOpenChange={setDialogOpen} showTrigger={false} next={lessonPath} />
      ) : null}
    </>
  );
}
