import { setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/page-shell';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PageShell namespace="dashboard" />;
}
