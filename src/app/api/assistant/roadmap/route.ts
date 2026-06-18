import { getSessionUser } from '@/lib/auth';
import { routing } from '@/i18n/routing';
import { draftRoadmap } from '@/lib/assistant/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function cleanLocale(value: unknown) {
  return typeof value === 'string' && (routing.locales as readonly string[]).includes(value)
    ? value
    : routing.defaultLocale;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let locale: string = routing.defaultLocale;
  try {
    const body = (await request.json()) as { locale?: unknown };
    locale = cleanLocale(body.locale);
  } catch {
    locale = routing.defaultLocale;
  }

  const draft = await draftRoadmap(user.id, locale);
  return Response.json(draft, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
