import { Paperclip } from 'lucide-react';

/** Downloadable resources for a lesson; hidden entirely when there are none. */
export function MaterialsList({
  items,
  heading,
}: {
  items: { label: string; url: string }[];
  heading: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{heading}</h2>
      <ul className="space-y-1.5">
        {items.map((m) => (
          <li key={m.url}>
            <a
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-foreground underline-offset-4 hover:underline"
            >
              <Paperclip className="size-3.5 text-muted-foreground" />
              {m.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
