'use client';

import { useState, useTransition } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/navigation';
import type { LessonForLearner } from '@/lib/data/types';
import { completeLessonAction } from '@/lib/courses/actions';
import { QuizForm } from './quiz-form';
import { CompletionCelebration } from './completion-celebration';

/**
 * The interactive tail of the player: the quiz (if any) and the footer controls,
 * sharing one completion flow.
 *  - No quiz → "Mark complete & continue" completes then advances.
 *  - Quiz    → passing completes the lesson; the footer "Next/Finish" then advances.
 * Completing the final lesson surfaces the celebration (with the issued certificate).
 * Every completion calls router.refresh() so the server-rendered rail/progress update live.
 */
export function LessonBottom({
  courseId,
  lessonId,
  quiz,
  initiallyCompleted,
  isLast,
  prevHref,
  nextHref,
}: {
  courseId: string;
  lessonId: string;
  quiz: LessonForLearner['quiz'];
  initiallyCompleted: boolean;
  isLast: boolean;
  prevHref: string | null;
  nextHref: string | null;
}) {
  const t = useTranslations('lesson');
  const router = useRouter();
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [serial, setSerial] = useState<string | null>(null);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [pending, start] = useTransition();

  function completeNow(navigate: boolean) {
    start(async () => {
      const res = await completeLessonAction(lessonId, courseId);
      if (!res.ok) {
        toast.error(t('saveError'));
        return;
      }
      setCompleted(true);
      router.refresh();
      if (res.pct >= 100) {
        setSerial(res.certificateSerial);
        setCelebrationOpen(true);
      } else if (navigate && nextHref) {
        router.push(nextHref);
      }
    });
  }

  function proceed() {
    if (isLast) {
      setCelebrationOpen(true);
    } else if (nextHref) {
      router.push(nextHref);
    }
  }

  const primary = quiz ? (
    <Button type="button" onClick={proceed} disabled={!completed || pending}>
      {isLast ? t('finishCourse') : t('next')}
    </Button>
  ) : (
    <Button type="button" onClick={() => completeNow(true)} disabled={pending}>
      {isLast ? t('finishCourse') : t('markComplete')}
    </Button>
  );

  return (
    <div className="space-y-6">
      {quiz ? <QuizForm quiz={quiz} onPass={() => completeNow(false)} /> : null}

      <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        {prevHref ? (
          <Button variant="outline" render={<Link href={prevHref} />}>
            <ChevronLeft className="size-4" />
            {t('previous')}
          </Button>
        ) : (
          <span />
        )}
        {primary}
      </div>

      <CompletionCelebration open={celebrationOpen} onOpenChange={setCelebrationOpen} serial={serial} />
    </div>
  );
}
