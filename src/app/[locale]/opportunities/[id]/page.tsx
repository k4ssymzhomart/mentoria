import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/data/provider';
import { getAuthUserId } from '@/lib/auth';
import { tl } from '@/lib/data/types';
import type { Tag } from '@/lib/data/types';
import { Link } from '@/i18n/navigation';
import { SaveButton } from '@/components/opportunities/save-button';
import { ApplyButton } from '@/components/opportunities/apply-button';
import { RelatedOpportunities } from '@/components/opportunities/related-opportunities';
import { formatDeadlineLabel, formatGradeRange } from '@/lib/opportunities/format';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const opp = await db.getOpportunity(id);
  return opp ? { title: tl(opp.title, locale) } : {};
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const opp = await db.getOpportunity(id);
  if (!opp) notFound();

  const t = await getTranslations('opportunities');
  const [tags, userId] = await Promise.all([db.getTags(), getAuthUserId()]);
  const saved = userId ? await db.listSaved(userId) : [];

  const tagMap = new Map(tags.map((tag) => [tag.slug, tag]));
  const savedSet = new Set(saved.map((s) => s.opportunity_id));
  const canSave = Boolean(userId);
  const isSaved = savedSet.has(opp.id);

  const deadline = formatDeadlineLabel(opp.deadline, locale, t);
  const meta = [
    t(`types.${opp.type}`),
    t(`formats.${opp.format}`),
    formatGradeRange(opp.grade_min, opp.grade_max, t),
    opp.organizer,
    opp.format !== 'online' ? opp.location : null,
    deadline?.text,
  ].filter(Boolean) as string[];

  const chips = opp.tags.map((s) => tagMap.get(s)).filter((x): x is Tag => Boolean(x));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-28 sm:px-6 sm:pb-12">
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t('detail.back')}
      </Link>

      <article className="mx-auto mt-6 max-w-3xl space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {tl(opp.title, locale)}
          </h1>
          <p className="text-sm text-muted-foreground">{meta.join(' · ')}</p>
          {chips.length ? (
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <span
                  key={c.slug}
                  className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {tl(c.label, locale)}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <ApplyButton opportunityId={opp.id} applyUrl={opp.apply_url} canTrack={canSave} />
          <SaveButton opportunityId={opp.id} initialSaved={isSaved} canSave={canSave} variant="full" />
        </div>

        {opp.description ? (
          <section className="space-y-2">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {t('detail.description')}
            </h2>
            <p className="whitespace-pre-line leading-relaxed">{tl(opp.description, locale)}</p>
          </section>
        ) : null}

        {opp.requirements ? (
          <section className="space-y-2">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {t('detail.requirements')}
            </h2>
            <p className="whitespace-pre-line leading-relaxed">{tl(opp.requirements, locale)}</p>
          </section>
        ) : null}
      </article>

      <div className="mt-12">
        <RelatedOpportunities current={opp} tagMap={tagMap} savedSet={savedSet} canSave={canSave} />
      </div>

      {/* Mobile sticky action bar so Apply is always reachable. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t bg-background/95 p-3 backdrop-blur sm:hidden">
        <ApplyButton opportunityId={opp.id} applyUrl={opp.apply_url} canTrack={canSave} className="flex-1" />
        <SaveButton opportunityId={opp.id} initialSaved={isSaved} canSave={canSave} variant="full" />
      </div>
    </div>
  );
}
