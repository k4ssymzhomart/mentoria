// Pure helpers for the Learning engine. The "next incomplete lesson" drives
// every "Continue" affordance (card, detail panel, player). Progress and dates
// are formatted locale-aware. Kept framework-free so they run on server or client.

import type { Lesson } from '@/lib/data/types';

/** First lesson (by order) not yet completed, or null when the course is done. */
export function nextIncompleteLesson<T extends { id: string }>(
  lessons: T[],
  completedIds: Iterable<string>,
): T | null {
  const done = new Set(completedIds);
  return lessons.find((l) => !done.has(l.id)) ?? null;
}

/** Where "Continue" should resume: next incomplete, or lesson 1 for review. */
export function resumeLessonId(lessons: Lesson[], completedIds: Iterable<string>): string | null {
  const next = nextIncompleteLesson(lessons, completedIds);
  return next?.id ?? lessons[0]?.id ?? null;
}

/** Locale-aware certificate date, e.g. "18 June 2026". */
export function formatCertificateDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}
