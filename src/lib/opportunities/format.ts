// Locale-aware formatting for deadlines and grade ranges. Pure functions that
// take a next-intl translator (scoped to the `opportunities` namespace) so they
// work in both Server and Client Components. Urgency is conveyed by weight/wording
// only — never color (the monochrome discipline of the Discovery feature).

type Translator = (key: string, values?: Record<string, string | number>) => string;

export type DeadlineKind = 'none' | 'passed' | 'today' | 'tomorrow' | 'soon' | 'far';

export function describeDeadline(deadline: string | null): { kind: DeadlineKind; days: number; iso: string | null } {
  if (!deadline) return { kind: 'none', days: 0, iso: null };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${deadline}T00:00:00`);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  let kind: DeadlineKind;
  if (days < 0) kind = 'passed';
  else if (days === 0) kind = 'today';
  else if (days === 1) kind = 'tomorrow';
  else if (days <= 14) kind = 'soon';
  else kind = 'far';
  return { kind, days, iso: deadline };
}

/** Returns the label and whether it should read as urgent (rendered bolder). */
export function formatDeadlineLabel(
  deadline: string | null,
  locale: string,
  t: Translator,
): { text: string; urgent: boolean } | null {
  const info = describeDeadline(deadline);
  switch (info.kind) {
    case 'none':
      return null;
    case 'passed':
      return { text: t('deadline.passed'), urgent: false };
    case 'today':
      return { text: t('deadline.today'), urgent: true };
    case 'tomorrow':
      return { text: t('deadline.tomorrow'), urgent: true };
    case 'soon':
      return { text: t('deadline.daysLeft', { days: info.days }), urgent: true };
    case 'far': {
      const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(
        new Date(`${info.iso}T00:00:00`),
      );
      return { text: t('deadline.untilDate', { date }), urgent: false };
    }
  }
}

export function formatGradeRange(
  min: number | null,
  max: number | null,
  t: Translator,
): string {
  if (min != null && max != null) return t('detail.grades', { min, max });
  if (max != null) return t('detail.gradesUp', { max });
  if (min != null) return t('detail.gradesFrom', { min });
  return t('detail.anyGrade');
}
