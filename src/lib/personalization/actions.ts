'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/data/provider';
import { getAuthUserId, getProfile } from '@/lib/auth';
import { interestVector } from './recommend';
import type { ProfilePatch, RoadmapItem } from '@/lib/data/types';

export type Result = { ok: true } | { ok: false; reason: 'auth' | 'error' };

function revalidatePersonalization() {
  revalidatePath('/[locale]/dashboard', 'page');
  revalidatePath('/[locale]/roadmap', 'page');
  revalidatePath('/[locale]/calendar', 'page');
}

export async function completeOnboardingAction(patch: ProfilePatch): Promise<Result> {
  const userId = await getAuthUserId();
  if (!userId) return { ok: false, reason: 'auth' };
  try {
    await db.updateProfile(userId, { ...patch, onboarded: true });
    revalidatePersonalization();
    revalidatePath('/[locale]/onboarding', 'page');
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function upsertRoadmapItemAction(
  item: Partial<RoadmapItem> & { grade: number; kind: RoadmapItem['kind'] },
): Promise<Result> {
  const userId = await getAuthUserId();
  if (!userId) return { ok: false, reason: 'auth' };
  try {
    await db.upsertRoadmapItem(item);
    revalidatePath('/[locale]/roadmap', 'page');
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function deleteRoadmapItemAction(id: string): Promise<Result> {
  const userId = await getAuthUserId();
  if (!userId) return { ok: false, reason: 'auth' };
  try {
    await db.deleteRoadmapItem(id);
    revalidatePath('/[locale]/roadmap', 'page');
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

// ── Generate starter roadmap ──────────────────────────────────────────────
// Maps the deterministic recommendations onto grades 9–12 with a simple, legible
// heuristic: foundational/language work earlier, competitions/research mid-track,
// applications & scholarships in grade 11. Persists editable roadmap items.

const COURSE_GRADE: Record<string, number> = { sat: 9, ielts: 9, admissions: 11 };
const OPP_GRADE: Partial<Record<string, number>> = {
  volunteering: 9, summer_school: 9,
  olympiad: 10, competition: 10, hackathon: 10, conference: 10,
  research: 11, internship: 11, scholarship: 11,
};

export async function generateStarterRoadmapAction(): Promise<Result> {
  const userId = await getAuthUserId();
  if (!userId) return { ok: false, reason: 'auth' };
  try {
    const profile = await getProfile();
    const vector = interestVector(profile);
    const [courses, opps] = await Promise.all([
      db.recommendCourses(vector, 6),
      db.recommendOpportunities(vector, profile?.grade ?? null, 8),
    ]);

    const positions: Record<number, number> = {};
    const nextPos = (g: number) => (positions[g] = (positions[g] ?? -1) + 1);

    const items: (Partial<RoadmapItem> & { grade: number; kind: RoadmapItem['kind'] })[] = [];
    for (const c of courses) {
      const grade = COURSE_GRADE[c.subject ?? ''] ?? 10;
      items.push({ grade, kind: 'course', ref_id: c.id, title: c.title, status: 'todo', position: nextPos(grade) });
    }
    for (const o of opps.slice(0, 6)) {
      const grade = OPP_GRADE[o.type] ?? 10;
      items.push({ grade, kind: 'opportunity', ref_id: o.id, title: o.title, status: 'todo', position: nextPos(grade) });
    }

    for (const item of items) await db.upsertRoadmapItem(item);
    revalidatePath('/[locale]/roadmap', 'page');
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
