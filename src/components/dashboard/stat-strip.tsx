/** Compact, monochrome strip of derivable counts — the calm header metrics. */
export function StatStrip({ stats }: { stats: { label: string; value: number }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border p-4">
          <div className="text-2xl font-semibold tabular-nums">{s.value}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
