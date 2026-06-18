import 'server-only';
import { createClient } from '@/utils/supabase/server';
import type { DataProvider } from './provider';
import type {
  Opportunity,
  OpportunityFilters,
  Course,
  CourseWithLessons,
  LessonForLearner,
  CertificateWithCourse,
} from './types';

const SEARCH_COLS = (q: string) =>
  ['title->>en', 'title->>ru', 'summary->>en', 'summary->>ru']
    .map((c) => `${c}.ilike.%${q}%`)
    .join(',');

export const supabaseProvider: DataProvider = {
  async getTags() {
    const s = await createClient();
    const { data } = await s.from('tags').select('*').order('sort');
    return data ?? [];
  },

  async listOpportunities(f: OpportunityFilters) {
    const s = await createClient();
    const pageSize = f.pageSize ?? 12;
    const page = f.page ?? 0;
    let q = s.from('opportunities').select('*', { count: 'exact' }).eq('is_published', true);
    if (f.search) q = q.or(SEARCH_COLS(f.search));
    if (f.types?.length) q = q.in('type', f.types);
    if (f.formats?.length) q = q.in('format', f.formats);
    if (f.tags?.length) q = q.overlaps('tags', f.tags);
    if (f.deadlineBefore) q = q.lte('deadline', f.deadlineBefore);
    if (f.grade != null) {
      q = q
        .or(`grade_min.is.null,grade_min.lte.${f.grade}`)
        .or(`grade_max.is.null,grade_max.gte.${f.grade}`);
    }
    q =
      f.sort === 'newest'
        ? q.order('created_at', { ascending: false })
        : q.order('deadline', { ascending: true, nullsFirst: false });
    q = q.range(page * pageSize, page * pageSize + pageSize - 1);
    const { data, count } = await q;
    return { items: (data ?? []) as Opportunity[], total: count ?? 0 };
  },

  async getOpportunity(id) {
    const s = await createClient();
    const { data } = await s.from('opportunities').select('*').eq('id', id).maybeSingle();
    return (data as Opportunity) ?? null;
  },

  async listCourses() {
    const s = await createClient();
    const { data } = await s.from('courses').select('*').eq('is_published', true).order('created_at');
    return (data ?? []) as Course[];
  },

  async getCourseBySlug(slug) {
    const s = await createClient();
    const { data } = await s
      .from('courses')
      .select('*, lessons(*)')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();
    if (!data) return null;
    (data as { lessons: { position: number }[] }).lessons.sort((a, b) => a.position - b.position);
    return data as CourseWithLessons;
  },

  async getLessonForLearner(courseSlug, lessonId) {
    const s = await createClient();
    const { data } = await s
      .from('lessons')
      .select('*, courses!inner(slug), quizzes(*)')
      .eq('id', lessonId)
      .eq('courses.slug', courseSlug)
      .maybeSingle();
    if (!data) return null;
    const row = data as Record<string, unknown> & { quizzes?: { questions: { correct?: string }[] }[] };
    const quiz = row.quizzes?.[0] ?? null;
    if (quiz) {
      quiz.questions = quiz.questions.map(({ correct, ...rest }) => rest); // strip answers
    }
    return { ...(row as object), quiz } as LessonForLearner;
  },

  async recommendOpportunities(interests, grade, limit = 8) {
    const s = await createClient();
    const { data } = await s.rpc('recommend_opportunities', {
      p_interests: interests,
      p_grade: grade,
      p_limit: limit,
    });
    return (data ?? []) as Opportunity[];
  },
  async recommendCourses(interests, limit = 6) {
    const s = await createClient();
    const { data } = await s.rpc('recommend_courses', { p_interests: interests, p_limit: limit });
    return (data ?? []) as Course[];
  },
  async updateProfile(userId, patch) {
    const s = await createClient();
    const { error } = await s.from('profiles').update(patch).eq('id', userId);
    if (error) throw error;
  },

  async listSaved(userId) {
    const s = await createClient();
    const { data } = await s
      .from('saved_opportunities')
      .select('*, opportunity:opportunities(*)')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });
    return (data ?? []) as never;
  },
  async saveOpportunity(userId, opportunityId) {
    const s = await createClient();
    await s
      .from('saved_opportunities')
      .upsert({ user_id: userId, opportunity_id: opportunityId }, { onConflict: 'user_id,opportunity_id' });
  },
  async unsaveOpportunity(userId, opportunityId) {
    const s = await createClient();
    await s.from('saved_opportunities').delete().eq('user_id', userId).eq('opportunity_id', opportunityId);
  },
  async setOpportunityStatus(userId, opportunityId, status) {
    const s = await createClient();
    await s
      .from('saved_opportunities')
      .upsert({ user_id: userId, opportunity_id: opportunityId, status }, { onConflict: 'user_id,opportunity_id' });
  },

  async enroll(userId, courseId) {
    const s = await createClient();
    await s.from('enrollments').upsert({ user_id: userId, course_id: courseId }, { onConflict: 'user_id,course_id' });
  },
  async listEnrollments(userId) {
    const s = await createClient();
    const { data } = await s.from('enrollments').select('*, course:courses(*)').eq('user_id', userId);
    const out = [];
    for (const e of data ?? []) {
      const row = e as { course_id: string; course: Course; enrolled_at: string; completed_at: string | null };
      const p = await this.getCourseProgress(userId, row.course_id);
      out.push({ course: row.course, enrolled_at: row.enrolled_at, completed_at: row.completed_at, ...p });
    }
    return out as never;
  },
  async getCourseProgress(userId, courseId) {
    const s = await createClient();
    const { count: total } = await s
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId);
    const { count: completed } = await s
      .from('lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('course_id', courseId);
    const c = completed ?? 0;
    const tot = total ?? 0;
    return { completed: c, total: tot, pct: tot ? Math.round((c / tot) * 100) : 0 };
  },
  async getCompletedLessonIds(userId, courseId) {
    const s = await createClient();
    const { data } = await s
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('course_id', courseId);
    return (data ?? []).map((r) => (r as { lesson_id: string }).lesson_id);
  },
  async completeLesson(userId, lessonId, courseId) {
    const s = await createClient();
    await s
      .from('lesson_progress')
      .upsert({ user_id: userId, lesson_id: lessonId, course_id: courseId }, { onConflict: 'user_id,lesson_id' });
  },
  async gradeQuiz(quizId, answers) {
    const s = await createClient();
    const { data, error } = await s.rpc('grade_quiz', { p_quiz_id: quizId, p_answers: answers });
    if (error) throw error;
    return data as { score: number; passed: boolean; total: number; correct: number };
  },
  async issueCertificate(courseId) {
    const s = await createClient();
    const { data, error } = await s.rpc('issue_certificate', { p_course_id: courseId });
    if (error) throw error;
    return data as never;
  },
  async listCertificates(userId) {
    const s = await createClient();
    const { data } = await s
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .order('issued_at', { ascending: false });
    return (data ?? []) as never;
  },
  async getCertificateBySerial(userId, serial) {
    const s = await createClient();
    const { data } = await s
      .from('certificates')
      .select('*, course:courses(*)')
      .eq('user_id', userId)
      .eq('serial', serial)
      .maybeSingle();
    return (data as CertificateWithCourse | null) ?? null;
  },

  async getRoadmap(userId) {
    const s = await createClient();
    const { data } = await s
      .from('roadmap_items')
      .select('*')
      .eq('user_id', userId)
      .order('grade')
      .order('position');
    return (data ?? []) as never;
  },
  async upsertRoadmapItem(item) {
    const s = await createClient();
    const {
      data: { user },
    } = await s.auth.getUser();
    await s.from('roadmap_items').upsert({ ...item, user_id: user!.id });
  },
  async deleteRoadmapItem(id) {
    const s = await createClient();
    await s.from('roadmap_items').delete().eq('id', id);
  },

  // ---- Admin: implemented in Phase 6 ----
  async adminUpsertOpportunity() {
    throw new Error('Phase 6');
  },
  async adminDeleteOpportunity() {
    throw new Error('Phase 6');
  },
  async adminUpsertCourse() {
    throw new Error('Phase 6');
  },
  async adminUpsertLesson() {
    throw new Error('Phase 6');
  },
  async adminDeleteCourse() {
    throw new Error('Phase 6');
  },
  async adminStats() {
    throw new Error('Phase 6');
  },
};
