import 'server-only';

function cleanOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
}

function firstHeader(value: string | null): string | null {
  return value?.split(',')[0]?.trim() || null;
}

export function requestOrigin(request: Request): string {
  const configured =
    cleanOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    cleanOrigin(process.env.RENDER_EXTERNAL_URL) ??
    cleanOrigin(process.env.SITE_URL);
  if (configured) return configured;

  const url = new URL(request.url);
  const host = firstHeader(request.headers.get('x-forwarded-host')) ?? request.headers.get('host') ?? url.host;
  const proto = firstHeader(request.headers.get('x-forwarded-proto')) ?? url.protocol.replace(':', '');

  return `${proto}://${host}`;
}

export function absoluteAppUrl(request: Request, path: string): string {
  return `${requestOrigin(request)}${path.startsWith('/') ? path : `/${path}`}`;
}
