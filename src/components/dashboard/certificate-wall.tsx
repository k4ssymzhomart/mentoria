import { Award } from 'lucide-react';
import { Link } from '@/i18n/navigation';

/** Earned certificates — the accent seal is appropriate here (success). */
export function CertificateWall({ certs }: { certs: { serial: string; courseTitle: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {certs.map((c) => (
        <Link
          key={c.serial}
          href={`/certificates/${c.serial}`}
          className="group rounded-lg border p-4 transition-colors hover:border-foreground/40"
        >
          <div className="flex items-center gap-2">
            <Award className="size-4 text-brand" />
            <span className="font-mono text-xs text-muted-foreground">{c.serial}</span>
          </div>
          <p className="mt-2 font-medium">{c.courseTitle}</p>
        </Link>
      ))}
    </div>
  );
}
