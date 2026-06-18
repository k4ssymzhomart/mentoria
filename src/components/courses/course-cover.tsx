import { cn } from '@/lib/utils';

/**
 * Course cover. A real image when `cover_url` is set; otherwise a calm monochrome
 * geometric placeholder (no brand accent — covers stay neutral so the accent is
 * reserved for progress/success). Deterministic angle per course for variety.
 */
export function CourseCover({
  coverUrl,
  title,
  seed = '',
  className,
}: {
  coverUrl: string | null;
  title: string;
  seed?: string;
  className?: string;
}) {
  if (coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverUrl}
        alt=""
        className={cn('aspect-[16/9] w-full object-cover', className)}
      />
    );
  }
  const hash = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  const angle = 90 + (hash % 6) * 15;
  return (
    <div
      aria-hidden
      className={cn(
        'relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden bg-muted',
        className,
      )}
      style={{
        backgroundImage: `repeating-linear-gradient(${angle}deg, color-mix(in oklch, var(--foreground) 5%, transparent) 0 1px, transparent 1px 14px)`,
      }}
    >
      <span className="select-none text-2xl font-semibold tracking-tight text-foreground/20">
        {title.slice(0, 2)}
      </span>
    </div>
  );
}
