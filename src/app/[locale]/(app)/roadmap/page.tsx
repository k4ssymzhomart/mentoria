import { getLocale, setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/data/provider';
import { getAuthUserId, requireOnboarding } from '@/lib/auth';
import { tl } from '@/lib/data/types';
import { RoadmapBoard } from '@/components/roadmap/roadmap-board';
import type { CatalogOption } from '@/components/roadmap/add-item-dialog';

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireOnboarding();

  const activeLocale = await getLocale();
  const userId = await getAuthUserId();

  const [items, courses, opps] = await Promise.all([
    userId ? db.getRoadmap(userId) : Promise.resolve([]),
    db.listCourses(),
    db.listOpportunities({ pageSize: 100 }),
  ]);

  const courseOptions: CatalogOption[] = courses.map((c) => ({
    id: c.id,
    label: tl(c.title, activeLocale),
    title: c.title,
  }));
  const oppOptions: CatalogOption[] = opps.items.map((o) => ({
    id: o.id,
    label: tl(o.title, activeLocale),
    title: o.title,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <RoadmapBoard
        key={items.map((i) => `${i.id}:${i.grade}:${i.position}:${i.status}`).join('|')}
        initialItems={items}
        courses={courseOptions}
        opportunities={oppOptions}
      />
    </div>
  );
}
