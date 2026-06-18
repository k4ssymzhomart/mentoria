'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SignInDialog } from '@/components/shell/sign-in-dialog';
import { useRouter } from '@/i18n/navigation';
import { enrollAction } from '@/lib/courses/actions';

/**
 * "Start course" everywhere a non-enrolled viewer sees it. Visitor → sign-in
 * dialog (intent preserved to lesson 1); signed-in → enroll (idempotent) then
 * drop into lesson 1. Monochrome by design — the accent is reserved for progress.
 */
export function EnrollButton({
  courseId,
  slug,
  firstLessonId,
  canEnroll,
  label,
  variant = 'default',
  size = 'default',
  className,
}: {
  courseId: string;
  slug: string;
  firstLessonId: string | null;
  canEnroll: boolean;
  label: string;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}) {
  const t = useTranslations('courses');
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  const lessonPath = firstLessonId
    ? `/courses/${slug}/lessons/${firstLessonId}`
    : `/courses/${slug}`;

  function onClick() {
    if (!canEnroll) {
      setDialogOpen(true);
      return;
    }
    start(async () => {
      const res = await enrollAction(courseId);
      if (res.ok) {
        router.push(lessonPath);
      } else if (res.reason === 'auth') {
        setDialogOpen(true);
      } else {
        toast.error(t('detail.start'));
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={onClick}
        disabled={pending}
      >
        {label}
      </Button>

      {!canEnroll ? (
        <SignInDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          showTrigger={false}
          next={lessonPath}
        />
      ) : null}
    </>
  );
}
