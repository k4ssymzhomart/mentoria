import { cn } from '@/lib/utils';

/**
 * The accent progress fill — the first place the brand color enters the product.
 * Server-renderable (plain divs) so it works without client JS; the width
 * transition gives the "fills as you complete" motion. Meaning is carried by the
 * adjacent NN% text and aria, never by color alone.
 */
export function ProgressBar({
  pct,
  label,
  className,
}: {
  pct: number;
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div
        className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}
