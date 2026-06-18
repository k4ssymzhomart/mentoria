'use client';

import { useRef, useState, useTransition } from 'react';
import { Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { tl } from '@/lib/data/types';
import type { LessonForLearner } from '@/lib/data/types';
import { gradeQuizAction } from '@/lib/courses/actions';

type Quiz = NonNullable<LessonForLearner['quiz']>;
type Result = { score: number; passed: boolean; total: number; correct: number };

/**
 * Single-select quiz. No correct answers exist in this payload (stripped server-
 * side); grading is the `grade_quiz` RPC. Passing fires `onPass` once so the
 * lesson completes. Pass banner is the accent; fail is neutral with unlimited retry.
 */
export function QuizForm({ quiz, onPass }: { quiz: Quiz; onPass: () => void }) {
  const t = useTranslations('quiz');
  const locale = useLocale();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const passedFired = useRef(false);

  const allAnswered = quiz.questions.every((q) => answers[q.id]);
  const locked = result?.passed ?? false;

  function submit() {
    setError(false);
    start(async () => {
      const res = await gradeQuizAction(quiz.id, answers);
      if (!res.ok) {
        setError(true);
        return;
      }
      const r: Result = { score: res.score, passed: res.passed, total: res.total, correct: res.correct };
      setResult(r);
      if (r.passed && !passedFired.current) {
        passedFired.current = true;
        onPass();
      }
    });
  }

  function retry() {
    setResult(null);
    setError(false);
  }

  return (
    <section className="space-y-5 rounded-lg border p-5">
      <h2 className="text-sm font-medium">{quiz.title ? tl(quiz.title, locale) : t('heading')}</h2>

      <div className="space-y-5">
        {quiz.questions.map((q, qi) => (
          <fieldset key={q.id} className="space-y-2" disabled={locked || pending}>
            <legend className="space-y-0.5">
              <span className="block text-xs text-muted-foreground">{t('question', { n: qi + 1 })}</span>
              <span className="block text-sm font-medium">{tl(q.prompt, locale)}</span>
            </legend>
            <div className="space-y-1.5">
              {q.options.map((o) => (
                <label
                  key={o.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors',
                    answers[q.id] === o.id ? 'border-foreground/40 bg-muted/50' : 'border-border hover:border-foreground/30',
                    (locked || pending) && 'cursor-default',
                  )}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={o.id}
                    checked={answers[q.id] === o.id}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                    className="size-4 accent-foreground"
                  />
                  <span>{tl(o.label, locale)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {result ? (
        result.passed ? (
          <div className="flex items-center gap-2 rounded-md border border-brand/30 bg-brand/10 px-4 py-3 text-sm font-medium text-foreground">
            <Check className="size-4 text-brand" />
            <span>{t('passed', { score: result.score })}</span>
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              {t('scoreDetail', { correct: result.correct, total: result.total })}
            </span>
          </div>
        ) : (
          <div className="space-y-3 rounded-md border bg-muted/40 px-4 py-3">
            <p className="text-sm">{t('failed', { score: result.score })}</p>
            <Button type="button" variant="outline" size="sm" onClick={retry}>
              {t('tryAgain')}
            </Button>
          </div>
        )
      ) : (
        <div className="flex items-center gap-3">
          <Button type="button" onClick={submit} disabled={!allAnswered || pending}>
            {t('check')}
          </Button>
          {!allAnswered ? <span className="text-xs text-muted-foreground">{t('chooseAnswer')}</span> : null}
          {error ? <span className="text-xs text-destructive">{t('error')}</span> : null}
        </div>
      )}
    </section>
  );
}
