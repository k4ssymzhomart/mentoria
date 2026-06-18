'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { completeOnboardingAction } from '@/lib/personalization/actions';

type Opt = { slug: string; label: string };
const GRADES = [8, 9, 10, 11];
const GOAL_KEYS = ['university', 'olympiad', 'exams', 'scholarships', 'project', 'volunteer'] as const;

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border text-foreground hover:border-foreground/40',
      )}
    >
      {active ? <Check className="size-3.5" /> : null}
      {children}
    </button>
  );
}

export function OnboardingWizard({
  directions,
  subjects,
  initial,
}: {
  directions: Opt[];
  subjects: Opt[];
  initial: { grade: number | null; interests: string[]; subjects: string[]; goals: string[] };
}) {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [grade, setGrade] = useState<number | null>(initial.grade);
  const [interests, setInterests] = useState<string[]>(initial.interests);
  const [subjectsSel, setSubjectsSel] = useState<string[]>(initial.subjects);
  const [goals, setGoals] = useState<string[]>(initial.goals);
  const [pending, start] = useTransition();

  const toggle = (list: string[], set: (v: string[]) => void, slug: string) =>
    set(list.includes(slug) ? list.filter((x) => x !== slug) : [...list, slug]);

  const total = 4;
  const canNext = step === 0 ? grade != null : step === 1 ? interests.length > 0 : true;

  function finish() {
    start(async () => {
      const res = await completeOnboardingAction({ grade, interests, subjects: subjectsSel, goals });
      if (res.ok) router.push('/dashboard');
      else toast.error(t('error'));
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-8 sm:py-12">
        {/* Step indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('step', { current: step + 1, total })}</span>
            <button type="button" onClick={finish} disabled={pending} className="hover:text-foreground">
              {t('skip')}
            </button>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className={cn('h-1 flex-1 rounded-full', i <= step ? 'bg-foreground' : 'bg-muted')} />
            ))}
          </div>
        </div>

        {/* Step body */}
        <div className="flex flex-1 flex-col justify-center py-8">
          {pending ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">{t('building')}</p>
            </div>
          ) : step === 0 ? (
            <div className="space-y-6">
              <Header title={t('grade.title')} subtitle={t('grade.subtitle')} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    aria-pressed={grade === g}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-lg border text-2xl font-semibold transition-colors',
                      grade === g ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/40',
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          ) : step === 1 ? (
            <div className="space-y-6">
              <Header title={t('interests.title')} subtitle={t('interests.subtitle')} />
              <div className="flex flex-wrap gap-2">
                {directions.map((d) => (
                  <Chip key={d.slug} active={interests.includes(d.slug)} onClick={() => toggle(interests, setInterests, d.slug)}>
                    {d.label}
                  </Chip>
                ))}
              </div>
              {interests.length === 0 ? <p className="text-xs text-muted-foreground">{t('interests.hint')}</p> : null}
            </div>
          ) : step === 2 ? (
            <div className="space-y-6">
              <Header title={t('subjects.title')} subtitle={t('subjects.subtitle')} />
              <div className="flex flex-wrap gap-2">
                {subjects.map((s) => (
                  <Chip key={s.slug} active={subjectsSel.includes(s.slug)} onClick={() => toggle(subjectsSel, setSubjectsSel, s.slug)}>
                    {s.label}
                  </Chip>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <Header title={t('goals.title')} subtitle={t('goals.subtitle')} />
              <div className="flex flex-wrap gap-2">
                {GOAL_KEYS.map((k) => (
                  <Chip key={k} active={goals.includes(k)} onClick={() => toggle(goals, setGoals, k)}>
                    {t(`goals.options.${k}`)}
                  </Chip>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{t('tip')}</p>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {!pending ? (
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              {t('back')}
            </Button>
            {step < total - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                {t('next')}
              </Button>
            ) : (
              <Button onClick={finish}>{t('finish')}</Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-1.5">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
}
