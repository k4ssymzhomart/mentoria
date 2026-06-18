import { getTranslations } from 'next-intl/server';
import { isSupabaseConfigured } from '@/lib/env';

export async function Footer() {
  const t = await getTranslations('footer');
  const tc = await getTranslations('common');

  return (
    <footer className="border-t border-border/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span>
          © {new Date().getFullYear()} {tc('appName')} — {t('tagline')}
        </span>
        <span className="font-mono text-xs">
          {t('phase')} · {t('dataSource')}: {isSupabaseConfigured() ? 'supabase' : 'mock'}
        </span>
      </div>
    </footer>
  );
}
