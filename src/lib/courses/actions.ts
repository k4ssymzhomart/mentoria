'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/data/provider';
import { getAuthUserId } from '@/lib/auth';

export type EnrollResult = { ok: true } | { ok: false; reason: 'auth' | 'error' };
export type CompleteResult =
  | { ok: true; completed: number; total: number; pct: number; certificateSerial: string | null }
  | { ok: false; reason: 'auth' | 'error' };
export type GradeResult =
  | { ok: true; score: number; passed: boolean; total: number; correct: number }
  | { ok: false; reason: 'auth' | 'error' };

/** Keep every server-rendered surface (cards, detail panel, player rail) in sync. */
function revalidateLearning() {
  revalidatePath('/[locale]/courses', 'page');
  revalidatePath('/[locale]/courses/[slug]', 'page');
  revalidatePath('/[locale]/courses/[slug]/lessons/[lessonId]', 'page');
  revalidatePath('/[locale]/dashboard', 'page');
}

export async function enrollAction(courseId: string): Promise<EnrollResult> {
  const userId = await getAuthUserId();
  if (!userId) return { ok: false, reason: 'auth' };
  try {
    await db.enroll(userId, courseId);
    revalidateLearning();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

/**
 * Completes a lesson, then re-reads progress. When the course hits 100% it issues
 * the certificate (idempotent, server-verified) and returns its serial so the
 * client can surface the completion celebration. A transient certificate failure
 * never fails the completion itself.
 */
export async function completeLessonAction(
  lessonId: string,
  courseId: string,
): Promise<CompleteResult> {
  const userId = await getAuthUserId();
  if (!userId) return { ok: false, reason: 'auth' };
  try {
    await db.completeLesson(userId, lessonId, courseId);
    const { completed, total, pct } = await db.getCourseProgress(userId, courseId);
    let certificateSerial: string | null = null;
    if (total > 0 && completed >= total) {
      try {
        const cert = await db.issueCertificate(courseId);
        certificateSerial = cert.serial;
      } catch {
        certificateSerial = null; // tolerate; re-issuable on next visit (idempotent)
      }
    }
    revalidateLearning();
    return { ok: true, completed, total, pct, certificateSerial };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function gradeQuizAction(
  quizId: string,
  answers: Record<string, string>,
): Promise<GradeResult> {
  const userId = await getAuthUserId();
  if (!userId) return { ok: false, reason: 'auth' };
  try {
    const r = await db.gradeQuiz(quizId, answers);
    return { ok: true, ...r };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
