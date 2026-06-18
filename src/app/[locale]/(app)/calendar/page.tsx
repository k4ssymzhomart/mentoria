import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/data/provider';
import { getAuthUserId, requireOnboarding } from '@/lib/auth';
import { tl } from '@/lib/data/types';
import type { Opportunity } from '@/lib/data/types';
import { CalendarView, type CalItem } from '@/components/calendar/calendar-view';
import { EmptyNudge } from '@/components/dashboard/empty-nudge';

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireOnboarding();

  const t = await getTranslations('calendar');
  const to = await getTranslations('opportunities');
  const activeLocale = await getLocale();
  const userId = await getAuthUserId();

  const saved = userId ? await db.listSaved(userId) : [];
  const items: CalItem[] = saved
    .map((s) => s.opportunity)
    .filter((o): o is Opportunity => Boolean(o && o.deadline))
    .map((o) => ({
      id: o.id,
      title: tl(o.title, activeLocale),
      typeLabel: to(`types.${o.type}`),
      date: o.deadline as string,
    }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>

      {items.length ? (
        <CalendarView items={items} />
      ) : (
        <EmptyNudge text={t('empty')} cta={{ href: '/opportunities', label: t('browse') }} />
      )}
    </div>
  );
}
