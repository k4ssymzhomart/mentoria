import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/data/provider';
import type { Opportunity, Tag } from '@/lib/data/types';
import { OpportunityCard } from './opportunity-card';

export async function RelatedOpportunities({
  current,
  tagMap,
  savedSet,
  canSave,
}: {
  current: Opportunity;
  tagMap: Map<string, Tag>;
  savedSet: Set<string>;
  canSave: boolean;
}) {
  const t = await getTranslations('opportunities');
  if (current.tags.length === 0) return null;

  const { items } = await db.listOpportunities({ tags: current.tags, pageSize: 4, sort: 'deadline' });
  const related = items.filter((o) => o.id !== current.id).slice(0, 3);
  if (related.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">{t('detail.related')}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opp={opp}
            tagMap={tagMap}
            saved={savedSet.has(opp.id)}
            canSave={canSave}
          />
        ))}
      </div>
    </section>
  );
}
