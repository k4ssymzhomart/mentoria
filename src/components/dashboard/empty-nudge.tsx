import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

/** A constructive empty state: one line of guidance and a single CTA. */
export function EmptyNudge({ text, cta }: { text: string; cta: { href: string; label: string } }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-6">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Button variant="outline" render={<Link href={cta.href} />}>
        {cta.label}
      </Button>
    </div>
  );
}
