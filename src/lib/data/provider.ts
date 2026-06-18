import type {
  Opportunity,
  OpportunityFilters,
  Course,
  CourseWithLessons,
  LessonForLearner,
  Lesson,
  Tag,
  Profile,
  Quiz,
  SavedOpportunity,
  EnrollmentWithProgress,
  Certificate,
  CertificateWithCourse,
  RoadmapItem,
  ProfilePatch,
  AdminCourseWithLessons,
  AdminStats,
} from './types';

/**
 * The swappable data-access layer. Components never touch the Supabase client
 * directly — everything goes through `db`. Entity methods grow phase by phase.
 */
export interface DataProvider {
  // ---- Catalog (public) ---- [consumed: Phase 2 & 3]
  getTags(): Promise<Tag[]>;
  listOpportunities(f: OpportunityFilters): Promise<{ items: Opportunity[]; total: number }>;
  getOpportunity(id: string): Promise<Opportunity | null>;
  listCourses(): Promise<Course[]>;
  getCourseBySlug(slug: string): Promise<CourseWithLessons | null>;
  getLessonForLearner(courseSlug: string, lessonId: string): Promise<LessonForLearner | null>;

  // ---- Personalization ---- [consumed: Phase 4 & 5]
  recommendOpportunities(interests: string[], grade: number | null, limit?: number): Promise<Opportunity[]>;
  recommendCourses(interests: string[], limit?: number): Promise<Course[]>;
  updateProfile(userId: string, patch: ProfilePatch): Promise<void>;

  // ---- Student state ---- [consumed: Phase 2,3,4]
  listSaved(userId: string): Promise<SavedOpportunity[]>;
  saveOpportunity(userId: string, opportunityId: string): Promise<void>;
  unsaveOpportunity(userId: string, opportunityId: string): Promise<void>;
  setOpportunityStatus(userId: string, opportunityId: string, status: 'saved' | 'applied'): Promise<void>;
  enroll(userId: string, courseId: string): Promise<void>;
  listEnrollments(userId: string): Promise<EnrollmentWithProgress[]>;
  getCourseProgress(userId: string, courseId: string): Promise<{ completed: number; total: number; pct: number }>;
  getCompletedLessonIds(userId: string, courseId: string): Promise<string[]>;
  completeLesson(userId: string, lessonId: string, courseId: string): Promise<void>;
  gradeQuiz(quizId: string, answers: Record<string, string>): Promise<{ score: number; passed: boolean; total: number; correct: number }>;
  issueCertificate(courseId: string): Promise<Certificate>;
  listCertificates(userId: string): Promise<Certificate[]>;
  getCertificateBySerial(userId: string, serial: string): Promise<CertificateWithCourse | null>;

  // ---- Roadmap ---- [consumed: Phase 4]
  getRoadmap(userId: string): Promise<RoadmapItem[]>;
  upsertRoadmapItem(item: Partial<RoadmapItem> & { grade: number; kind: RoadmapItem['kind'] }): Promise<void>;
  deleteRoadmapItem(id: string): Promise<void>;

  // ---- Admin ---- [consumed: Phase 6 — signatures only here]
  adminListOpportunities(): Promise<Opportunity[]>;
  adminGetOpportunity(id: string): Promise<Opportunity | null>;
  adminUpsertOpportunity(input: Partial<Opportunity>): Promise<Opportunity>;
  adminDeleteOpportunity(id: string): Promise<void>;
  adminToggleOpportunity(id: string, isPublished: boolean): Promise<void>;
  adminListCourses(): Promise<Course[]>;
  adminGetCourse(id: string): Promise<AdminCourseWithLessons | null>;
  adminUpsertCourse(input: Partial<Course>): Promise<Course>;
  adminUpsertLesson(input: Partial<Lesson>): Promise<void>;
  adminDeleteLesson(id: string): Promise<void>;
  adminReorderLessons(items: { id: string; position: number }[]): Promise<void>;
  adminUpsertQuiz(input: Partial<Quiz> & { lesson_id: string }): Promise<void>;
  adminDeleteQuiz(id: string): Promise<void>;
  adminToggleCourse(id: string, isPublished: boolean): Promise<void>;
  adminDeleteCourse(id: string): Promise<void>;
  adminListUsers(): Promise<Profile[]>;
  adminStats(): Promise<AdminStats>;
}

import { supabaseProvider } from './supabase-provider';
export const db: DataProvider = supabaseProvider;
