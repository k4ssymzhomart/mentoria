import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, CalendarRange, Compass, GraduationCap } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const features = [
  { key: 'opportunities', Icon: Compass },
  { key: 'courses', Icon: GraduationCap },
  { key: 'roadmap', Icon: CalendarRange },
] as const;

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('landing');

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="flex flex-col items-start gap-6 py-20 sm:py-28">
        <Badge
          variant="outline"
          className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
        >
          {t('badge')}
        </Badge>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-pretty text-lg text-muted-foreground">
          {t('subtitle')}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/opportunities" />}
          >
            {t('ctaBrowse')}
            <ArrowRight className="size-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/courses" />}
          >
            {t('ctaCourses')}
          </Button>
        </div>
      </section>

      <section className="grid gap-4 pb-24 sm:grid-cols-3">
        {features.map(({ key, Icon }) => (
          <Card key={key} className="border-border/80">
            <CardHeader>
              <div className="mb-2 grid size-9 place-items-center rounded-md border">
                <Icon className="size-4" />
              </div>
              <CardTitle className="text-base">
                {t(`features.${key}.title`)}
              </CardTitle>
              <CardDescription>
                {t(`features.${key}.description`)}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  );
}
