/**
 * Only allow same-origin, path-style redirect targets. Prevents open-redirect
 * abuse via crafted `?next=` params (e.g. `//evil.com`, `https://evil.com`).
 */
export function safeNext(
  next: string | null | undefined,
  fallback = '/',
): string {
  if (!next) return fallback;
  // Must be root-relative, and not protocol-relative (`//host`) or a full URL.
  if (!next.startsWith('/') || next.startsWith('//')) return fallback;
  return next;
}
