import { setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/page-shell';

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PageShell namespace="roadmap" />;
}
