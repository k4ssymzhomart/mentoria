'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export type CalItem = { id: string; title: string; typeLabel: string; date: string };

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function CalendarView({ items }: { items: CalItem[] }) {
  const t = useTranslations('calendar');
  const locale = useLocale();
  const today = new Date();
  const todayISO = iso(today);

  const [view, setView] = useState<'month' | 'agenda'>('month');
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    // Default to the agenda on small screens (read once on mount, post-hydration).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.matchMedia('(max-width: 640px)').matches) setView('agenda');
  }, []);

  const byDate = useMemo(() => {
    const map = new Map<string, CalItem[]>();
    for (const it of items) map.set(it.date, [...(map.get(it.date) ?? []), it]);
    return map;
  }, [items]);

  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    // Jan 1 2024 is a Monday → Monday-first headers.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)));
  }, [locale]);

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(cursor.y, cursor.m, 1),
  );
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const leading = (new Date(cursor.y, cursor.m, 1).getDay() + 6) % 7;
  const fullDate = (d: string) =>
    new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(
      new Date(`${d}T00:00:00`),
    );

  const agenda = useMemo(
    () => items.filter((i) => i.date >= todayISO).sort((a, b) => a.date.localeCompare(b.date)),
    [items, todayISO],
  );
  const agendaGroups = useMemo(() => {
    const groups: { date: string; items: CalItem[] }[] = [];
    for (const it of agenda) {
      const last = groups[groups.length - 1];
      if (last && last.date === it.date) last.items.push(it);
      else groups.push({ date: it.date, items: [it] });
    }
    return groups;
  }, [agenda]);

  const selectedItems = selected ? byDate.get(selected) ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        {view === 'month' ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" aria-label={t('prev')} onClick={() => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 }))}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-40 text-center text-sm font-medium capitalize">{monthLabel}</span>
            <Button variant="outline" size="icon-sm" aria-label={t('next')} onClick={() => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { ...c, m: c.m + 1 }))}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : (
          <span className="text-sm font-medium">{t('agenda')}</span>
        )}
        <div className="flex rounded-lg border p-0.5">
          {(['month', 'agenda'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn('rounded-md px-3 py-1 text-xs transition-colors', view === v ? 'bg-muted font-medium' : 'text-muted-foreground')}
            >
              {t(v)}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-1">
            {weekdays.map((w) => (
              <div key={w} className="pb-1 text-center text-xs capitalize text-muted-foreground">{w}</div>
            ))}
            {Array.from({ length: leading }).map((_, i) => <div key={`b${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const d = `${cursor.y}-${pad(cursor.m + 1)}-${pad(day)}`;
              const dayItems = byDate.get(d) ?? [];
              const isToday = d === todayISO;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelected(dayItems.length ? d : null)}
                  className={cn(
                    'flex aspect-square flex-col items-center justify-center gap-1 rounded-md border text-sm transition-colors',
                    isToday ? 'border-foreground font-semibold' : 'border-transparent hover:border-border',
                    selected === d && 'bg-muted',
                    !dayItems.length && 'text-muted-foreground/70',
                  )}
                  aria-label={dayItems.length ? `${day}: ${t('due', { count: dayItems.length })}` : String(day)}
                >
                  <span>{day}</span>
                  {dayItems.length ? <span className="size-1.5 rounded-full bg-foreground" /> : <span className="size-1.5" />}
                </button>
              );
            })}
          </div>

          {selected ? (
            <div className="space-y-2 rounded-lg border p-4">
              <p className="text-sm font-medium capitalize">{fullDate(selected)}</p>
              <ul className="divide-y">
                {selectedItems.map((it) => (
                  <li key={it.id}>
                    <Link href={`/opportunities/${it.id}`} className="flex items-center justify-between gap-3 py-2 text-sm hover:text-foreground">
                      <span className="truncate">{it.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{it.typeLabel}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-5">
          {agendaGroups.map((g) => (
            <div key={g.date} className="space-y-1.5">
              <p className={cn('text-sm font-medium capitalize', g.date === todayISO && 'text-foreground')}>
                {g.date === todayISO ? `${t('today')} · ` : ''}{fullDate(g.date)}
              </p>
              <ul className="divide-y rounded-lg border">
                {g.items.map((it) => (
                  <li key={it.id}>
                    <Link href={`/opportunities/${it.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/50">
                      <span className="truncate">{it.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{it.typeLabel}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
