import { getTranslations } from 'next-intl/server';
import { RouteStatus } from '@/components/route-state';

export default async function NotFound() {
  const t = await getTranslations('states.notFound');

  return (
    <RouteStatus
      title={t('title')}
      description={t('body')}
      actionLabel={t('home')}
    />
  );
}
