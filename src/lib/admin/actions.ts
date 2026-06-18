'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/data/provider';
import type {
  CourseDifficulty,
  Localized,
  Material,
  OpportunityFormat,
  OpportunityType,
  QuizQuestion,
} from '@/lib/data/types';

type Result = { ok: true } | { ok: false; reason: 'error' | 'validation' };
const locales = ['en', 'ru', 'kk'] as const;

function localized(fd: FormData, name: string): Localized {
  return Object.fromEntries(locales.map((locale) => [locale, String(fd.get(`${name}.${locale}`) ?? '').trim()])) as Localized;
}

function nullableLocalized(fd: FormData, name: string): Localized | null {
  const value = localized(fd, name);
  return Object.values(value).some(Boolean) ? value : null;
}

function strings(fd: FormData, name: string): string[] {
  return fd.getAll(name).map(String).filter(Boolean);
}

function numberOrNull(value: FormDataEntryValue | null): number | null {
  if (value == null || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function textOrNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? '').trim();
  return text || null;
}

function bool(fd: FormData, name: string) {
  return fd.get(name) === 'on';
}

function revalidateAdmin() {
  revalidatePath('/[locale]/admin', 'layout');
  revalidatePath('/[locale]/opportunities', 'page');
  revalidatePath('/[locale]/courses', 'page');
  revalidatePath('/[locale]/dashboard', 'page');
}

export async function saveOpportunityAction(fd: FormData): Promise<Result> {
  await requireAdmin();
  const title = localized(fd, 'title');
  if (!title.ru || !title.en) return { ok: false, reason: 'validation' };
  try {
    await db.adminUpsertOpportunity({
      id: textOrNull(fd.get('id')) ?? undefined,
      title,
      summary: nullableLocalized(fd, 'summary'),
      description: nullableLocalized(fd, 'description'),
      requirements: nullableLocalized(fd, 'requirements'),
      type: String(fd.get('type') ?? 'olympiad') as OpportunityType,
      format: String(fd.get('format') ?? 'online') as OpportunityFormat,
      tags: strings(fd, 'tags'),
      grade_min: numberOrNull(fd.get('grade_min')),
      grade_max: numberOrNull(fd.get('grade_max')),
      deadline: textOrNull(fd.get('deadline')),
      location: textOrNull(fd.get('location')),
      organizer: textOrNull(fd.get('organizer')),
      apply_url: textOrNull(fd.get('apply_url')),
      image_url: textOrNull(fd.get('image_url')),
      featured: bool(fd, 'featured'),
      is_published: bool(fd, 'is_published'),
    });
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function deleteOpportunityAction(id: string): Promise<Result> {
  await requireAdmin();
  try {
    await db.adminDeleteOpportunity(id);
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function toggleOpportunityAction(id: string, isPublished: boolean): Promise<Result> {
  await requireAdmin();
  try {
    await db.adminToggleOpportunity(id, isPublished);
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function createCourseAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const title = localized(fd, 'title');
  const slug = String(fd.get('slug') ?? '').trim();
  if (!title.ru || !title.en || !slug) return;
  const course = await db.adminUpsertCourse({
    slug,
    title,
    summary: nullableLocalized(fd, 'summary'),
    description: nullableLocalized(fd, 'description'),
    subject: textOrNull(fd.get('subject')),
    difficulty: String(fd.get('difficulty') ?? 'beginner') as CourseDifficulty,
    tags: strings(fd, 'tags'),
    estimated_hours: numberOrNull(fd.get('estimated_hours')),
    cover_url: textOrNull(fd.get('cover_url')),
    is_published: bool(fd, 'is_published'),
  });
  revalidateAdmin();
  redirect({ href: `/admin/courses/${course.id}`, locale: await getLocale() });
}

export async function saveCourseAction(fd: FormData): Promise<Result> {
  await requireAdmin();
  const id = textOrNull(fd.get('id'));
  const title = localized(fd, 'title');
  const slug = String(fd.get('slug') ?? '').trim();
  if (!id || !title.ru || !title.en || !slug) return { ok: false, reason: 'validation' };
  try {
    await db.adminUpsertCourse({
      id,
      slug,
      title,
      summary: nullableLocalized(fd, 'summary'),
      description: nullableLocalized(fd, 'description'),
      subject: textOrNull(fd.get('subject')),
      difficulty: String(fd.get('difficulty') ?? 'beginner') as CourseDifficulty,
      tags: strings(fd, 'tags'),
      estimated_hours: numberOrNull(fd.get('estimated_hours')),
      cover_url: textOrNull(fd.get('cover_url')),
      is_published: bool(fd, 'is_published'),
    });
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function toggleCourseAction(id: string, isPublished: boolean): Promise<Result> {
  await requireAdmin();
  try {
    await db.adminToggleCourse(id, isPublished);
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function deleteCourseAction(id: string): Promise<Result> {
  await requireAdmin();
  try {
    await db.adminDeleteCourse(id);
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

function materialList(fd: FormData): Material[] {
  return [0, 1, 2].flatMap((i) => {
    const label = localized(fd, `material_${i}_label`);
    const url = textOrNull(fd.get(`material_${i}_url`));
    return url || Object.values(label).some(Boolean) ? [{ label, url: url ?? '' }] : [];
  });
}

export async function saveLessonAction(fd: FormData): Promise<Result> {
  await requireAdmin();
  const courseId = textOrNull(fd.get('course_id'));
  const title = localized(fd, 'title');
  if (!courseId || !title.ru || !title.en) return { ok: false, reason: 'validation' };
  try {
    await db.adminUpsertLesson({
      id: textOrNull(fd.get('id')) ?? undefined,
      course_id: courseId,
      position: numberOrNull(fd.get('position')) ?? 1,
      title,
      content_type: String(fd.get('content_type') ?? 'text') as 'text' | 'video',
      video_url: textOrNull(fd.get('video_url')),
      body: nullableLocalized(fd, 'body'),
      materials: materialList(fd),
      duration_min: numberOrNull(fd.get('duration_min')),
    });
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function deleteLessonAction(id: string): Promise<Result> {
  await requireAdmin();
  try {
    await db.adminDeleteLesson(id);
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function reorderLessonsAction(items: { id: string; position: number }[]): Promise<Result> {
  await requireAdmin();
  try {
    await db.adminReorderLessons(items);
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

function quizQuestions(fd: FormData): QuizQuestion[] {
  const out: QuizQuestion[] = [];
  for (let qi = 0; qi < 3; qi++) {
    const prompt = localized(fd, `q_${qi}_prompt`);
    if (!Object.values(prompt).some(Boolean)) continue;
    const options = [0, 1, 2, 3].flatMap((oi) => {
      const label = localized(fd, `q_${qi}_o_${oi}`);
      return Object.values(label).some(Boolean) ? [{ id: `o${oi + 1}`, label }] : [];
    });
    if (options.length < 2) continue;
    out.push({
      id: `q${qi + 1}`,
      prompt,
      options,
      correct: String(fd.get(`q_${qi}_correct`) ?? options[0].id),
    });
  }
  return out;
}

export async function saveQuizAction(fd: FormData): Promise<Result> {
  await requireAdmin();
  const lessonId = textOrNull(fd.get('lesson_id'));
  if (!lessonId) return { ok: false, reason: 'validation' };
  try {
    await db.adminUpsertQuiz({
      id: textOrNull(fd.get('id')) ?? undefined,
      lesson_id: lessonId,
      title: nullableLocalized(fd, 'title'),
      passing_score: numberOrNull(fd.get('passing_score')) ?? 70,
      questions: quizQuestions(fd),
    });
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function deleteQuizAction(id: string): Promise<Result> {
  await requireAdmin();
  try {
    await db.adminDeleteQuiz(id);
    revalidateAdmin();
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
