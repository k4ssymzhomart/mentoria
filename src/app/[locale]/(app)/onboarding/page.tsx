import { getLocale, setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/data/provider';
import { requireUser, getProfile } from '@/lib/auth';
import { tl } from '@/lib/data/types';
import { OnboardingWizard } from '@/components/onboarding/wizard';

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser();

  const [tags, profile, activeLocale] = await Promise.all([db.getTags(), getProfile(), getLocale()]);
  const directions = tags
    .filter((t) => t.kind === 'direction')
    .map((t) => ({ slug: t.slug, label: tl(t.label, activeLocale) }));
  const subjects = tags
    .filter((t) => t.kind === 'subject')
    .map((t) => ({ slug: t.slug, label: tl(t.label, activeLocale) }));

  return (
    <OnboardingWizard
      directions={directions}
      subjects={subjects}
      initial={{
        grade: profile?.grade ?? null,
        interests: profile?.interests ?? [],
        subjects: profile?.subjects ?? [],
        goals: profile?.goals ?? [],
      }}
    />
  );
}
