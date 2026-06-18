import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { BarChart3, BookOpen, GraduationCap, Users } from 'lucide-react';
import { db } from '@/lib/data/provider';
import { tl } from '@/lib/data/types';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('admin');
  const activeLocale = await getLocale();
  const [stats, opportunities, courses, tags] = await Promise.all([
    db.adminStats(),
    db.adminListOpportunities(),
    db.adminListCourses(),
    db.getTags(),
  ]);
  const tagMap = new Map(tags.map((tag) => [tag.slug, tag]));

  const statCards = [
    { label: t('stats.users'), value: stats.users, Icon: Users },
    { label: t('stats.opportunities'), value: stats.opportunities, Icon: GraduationCap },
    { label: t('stats.courses'), value: stats.courses, Icon: BookOpen },
    { label: t('stats.enrollments'), value: stats.enrollments, Icon: BarChart3 },
    { label: t('stats.completions'), value: stats.completions, Icon: BarChart3 },
    { label: t('stats.saves'), value: stats.saves, Icon: BarChart3 },
  ];

  const typeCounts = opportunities.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});
  const tagCounts = opportunities.reduce<Record<string, number>>((acc, item) => {
    for (const tag of item.tags) acc[tag] = (acc[tag] ?? 0) + 1;
    return acc;
  }, {});
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxType = Math.max(1, ...Object.values(typeCounts));
  const maxTag = Math.max(1, ...topTags.map(([, count]) => count));

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button nativeButton={false} variant="outline" render={<Link href="/admin/opportunities" />}>
            {t('actions.newOpportunity')}
          </Button>
          <Button nativeButton={false} variant="outline" render={<Link href="/admin/courses" />}>
            {t('actions.newCourse')}
          </Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">{t('charts.byType')}</h2>
          <div className="space-y-2 rounded-lg border p-4">
            {Object.entries(typeCounts).map(([type, count]) => (
              <div key={type} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{type}</span>
                  <span className="tabular-nums text-muted-foreground">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-foreground/70" style={{ width: `${(count / maxType) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">{t('charts.byTag')}</h2>
          <div className="space-y-2 rounded-lg border p-4">
            {topTags.map(([slug, count]) => (
              <div key={slug} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{tl(tagMap.get(slug)?.label, activeLocale) || slug}</span>
                  <span className="tabular-nums text-muted-foreground">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-foreground/70" style={{ width: `${(count / maxTag) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">{t('recent.opportunities')}</h2>
          <div className="divide-y rounded-lg border">
            {opportunities.slice(0, 5).map((item) => (
              <Link key={item.id} href="/admin/opportunities" className="flex items-center justify-between gap-3 p-3 text-sm hover:bg-muted/50">
                <span className="line-clamp-1">{tl(item.title, activeLocale)}</span>
                <span className="text-xs text-muted-foreground">{item.is_published ? t('status.published') : t('status.draft')}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">{t('recent.courses')}</h2>
          <div className="divide-y rounded-lg border">
            {courses.slice(0, 5).map((item) => (
              <Link key={item.id} href={`/admin/courses/${item.id}`} className="flex items-center justify-between gap-3 p-3 text-sm hover:bg-muted/50">
                <span className="line-clamp-1">{tl(item.title, activeLocale)}</span>
                <span className="text-xs text-muted-foreground">{item.is_published ? t('status.published') : t('status.draft')}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
