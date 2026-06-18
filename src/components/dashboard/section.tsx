import { Link } from '@/i18n/navigation';

/** A titled dashboard section with an optional "view all →" action. */
export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {action ? (
          <Link href={action.href} className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
            {action.label} →
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
