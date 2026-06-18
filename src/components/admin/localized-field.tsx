'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Localized } from '@/lib/data/types';

const locales = ['ru', 'en', 'kk'] as const;

export function LocalizedField({
  name,
  label,
  value,
  multiline = false,
  rows = 3,
}: {
  name: string;
  label: string;
  value?: Localized | null;
  multiline?: boolean;
  rows?: number;
}) {
  const t = useTranslations('locale');

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Tabs defaultValue="ru">
        <TabsList>
          {locales.map((locale) => (
            <TabsTrigger key={locale} value={locale}>
              {t(locale)}
            </TabsTrigger>
          ))}
        </TabsList>
        {locales.map((locale) => (
          <TabsContent key={locale} value={locale}>
            {multiline ? (
              <textarea
                name={`${name}.${locale}`}
                defaultValue={value?.[locale] ?? ''}
                rows={rows}
                className="min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            ) : (
              <Input name={`${name}.${locale}`} defaultValue={value?.[locale] ?? ''} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
