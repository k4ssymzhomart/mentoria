import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Bot, CalendarDays, CheckCircle2, Compass, GraduationCap, Languages, LayoutDashboard, Map } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { SignInDialog } from '@/components/shell/sign-in-dialog';

const engineIcons = {
  discover: Compass,
  learn: GraduationCap,
  personalized: Map,
} as const;

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('landing');

  return (
    <div>
      <section className="border-b">
        <div className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6">
          <div className="max-w-4xl space-y-6">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{t('badge')}</p>
            <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-7xl lg:text-8xl">
              {t('title')}
            </h1>
            <p className="max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
              {t('subtitle')}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button size="lg" nativeButton={false} render={<Link href="/opportunities" />}>
                {t('ctaBrowse')}
                <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/courses" />}>
                {t('ctaCourses')}
              </Button>
              <SignInDialog
                triggerLabel={t('joinTitle')}
                title={t('joinTitle')}
                description={t('joinBody')}
              />
            </div>
          </div>

          <div className="mt-12 rounded-lg border bg-card p-4 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <LayoutDashboard className="size-4" />
                    {t('visual.dashboard')}
                  </div>
                  <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                    RU · EN · KK
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="rounded-md border p-3">
                      <div className="h-7 w-10 rounded bg-foreground/90" />
                      <div className="mt-3 h-2 w-20 rounded bg-muted" />
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[Compass, GraduationCap, Bot].map((Icon, i) => (
                    <div key={i} className="rounded-md border p-3">
                      <Icon className="size-4" />
                      <div className="mt-4 h-2 w-24 rounded bg-foreground/25" />
                      <div className="mt-2 h-2 w-32 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3 rounded-md border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="size-4" />
                  {t('visual.roadmap')}
                </div>
                {[9, 10, 11, 12].map((grade, i) => (
                  <div key={grade} className="rounded-md border bg-background p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span>{t('visual.grade', { grade })}</span>
                      <span className="text-muted-foreground">{i + 1}/4</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-muted">
                      <div className="h-1.5 rounded-full bg-brand" style={{ width: `${(i + 1) * 22}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 border-b px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('problem.title')}</h2>
        <div className="space-y-4 text-lg text-muted-foreground">
          <p>{t('problem.body')}</p>
          <p className="text-foreground">{t('problem.solution')}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-8 border-b px-4 py-16 sm:px-6">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('engines.title')}</h2>
          <p className="text-muted-foreground">{t('engines.subtitle')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {(['discover', 'learn', 'personalized'] as const).map((key) => {
            const Icon = engineIcons[key];
            return (
              <div key={key} className="rounded-lg border p-5">
                <Icon className="size-5" />
                <h3 className="mt-5 font-semibold">{t(`engines.${key}.title`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(`engines.${key}.body`)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 border-b px-4 py-16 sm:px-6 lg:grid-cols-2">
        {(['students', 'mentoria'] as const).map((key) => (
          <div key={key} className="rounded-lg border p-6">
            <h2 className="text-2xl font-semibold tracking-tight">{t(`audience.${key}.title`)}</h2>
            <p className="mt-3 text-muted-foreground">{t(`audience.${key}.body`)}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
            <Languages className="size-4" />
            {t('trust.languages')}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
            <CheckCircle2 className="size-4" />
            {t('trust.device')}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
            <CheckCircle2 className="size-4" />
            {t('trust.anytime')}
          </span>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight">{t('closing.title')}</h2>
          <div className="flex flex-wrap gap-3">
            <Button nativeButton={false} render={<Link href="/opportunities" />}>{t('ctaBrowse')}</Button>
            <Button nativeButton={false} variant="outline" render={<Link href="/courses" />}>{t('ctaCourses')}</Button>
            <SignInDialog
              triggerLabel={t('joinTitle')}
              title={t('joinTitle')}
              description={t('joinBody')}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
