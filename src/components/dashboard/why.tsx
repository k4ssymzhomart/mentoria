import { getTranslations } from 'next-intl/server';

/**
 * The plain-language rationale under a recommended item — derived from the tags
 * it shares with the student's interest vector. Previews the natural-language
 * explanation the Phase 5 assistant will give. Hidden when there's no overlap.
 */
export async function Why({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null;
  const t = await getTranslations('dashboard');
  return <p className="mt-1.5 text-xs text-muted-foreground">{t('why', { tags: labels.join(', ') })}</p>;
}
