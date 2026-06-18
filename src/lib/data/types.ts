import type { Locale } from '@/i18n/routing';

export type { Locale };

// ── Phase 0 carry-overs (auth/profile) ───────────────────────────────────
export type UserRole = 'student' | 'admin' | 'mentor';

/**
 * A value translated into every supported locale. Content rows store these as
 * JSONB so a 4th language needs zero schema change. `Localized` (no arg) ==
 * `Record<Locale, string>`, which is what content fields use.
 */
export type Localized<T = string> = Record<Locale, T>;

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  grade: number | null;
  interests: string[];
  subjects: string[];
  goals: string[];
  locale: Locale;
  onboarded: boolean;
  created_at: string;
}

export interface SessionUser {
  id: string;
  email: string | null;
}

// ── Phase 1 content model ─────────────────────────────────────────────────
export type OpportunityType =
  | 'olympiad' | 'hackathon' | 'scholarship' | 'internship'
  | 'summer_school' | 'research' | 'volunteering' | 'competition' | 'conference';
export type OpportunityFormat = 'online' | 'offline' | 'hybrid';
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type TagKind = 'direction' | 'subject';

export interface Tag {
  slug: string;
  kind: TagKind;
  label: Localized;
  sort: number;
}

export interface Opportunity {
  id: string;
  title: Localized;
  summary: Localized | null;
  description: Localized | null;
  requirements: Localized | null;
  type: OpportunityType;
  format: OpportunityFormat;
  tags: string[];
  grade_min: number | null;
  grade_max: number | null;
  deadline: string | null;
  location: string | null;
  organizer: string | null;
  apply_url: string | null;
  image_url: string | null;
  featured: boolean;
  is_published: boolean;
  created_at: string;
}

export interface Material {
  label: Localized;
  url: string;
}
export interface Lesson {
  id: string;
  course_id: string;
  position: number;
  title: Localized;
  content_type: 'text' | 'video';
  video_url: string | null;
  body: Localized | null;
  materials: Material[];
  duration_min: number | null;
}
export interface QuizOption {
  id: string;
  label: Localized;
}
export interface QuizQuestion {
  id: string;
  prompt: Localized;
  options: QuizOption[];
  correct?: string; // stripped before reaching the client
}
export interface Quiz {
  id: string;
  lesson_id: string;
  title: Localized | null;
  passing_score: number;
  questions: QuizQuestion[];
}

export interface Course {
  id: string;
  slug: string;
  title: Localized;
  summary: Localized | null;
  description: Localized | null;
  subject: string | null;
  difficulty: CourseDifficulty;
  tags: string[];
  estimated_hours: number | null;
  cover_url: string | null;
  is_published: boolean;
  created_at: string;
}
export type CourseWithLessons = Course & { lessons: Lesson[] };
export type LessonForLearner = Lesson & {
  quiz:
    | (Omit<Quiz, 'questions'> & { questions: Omit<QuizQuestion, 'correct'>[] })
    | null;
};

export interface SavedOpportunity {
  id: string;
  opportunity_id: string;
  status: 'saved' | 'applied';
  saved_at: string;
  opportunity?: Opportunity;
}
export interface EnrollmentWithProgress {
  course: Course;
  enrolled_at: string;
  completed_at: string | null;
  completed: number;
  total: number;
  pct: number;
}
export interface Certificate {
  id: string;
  course_id: string;
  serial: string;
  issued_at: string;
}
export interface RoadmapItem {
  id: string;
  grade: number;
  position: number;
  kind: 'course' | 'opportunity' | 'milestone';
  ref_id: string | null;
  title: Localized | null;
  status: 'todo' | 'in_progress' | 'done';
}

export interface OpportunityFilters {
  search?: string;
  types?: OpportunityType[];
  formats?: OpportunityFormat[];
  tags?: string[];
  grade?: number;
  deadlineBefore?: string;
  sort?: 'deadline' | 'newest';
  page?: number;
  pageSize?: number;
}

/**
 * Read a localized content value for the active locale, with fallback.
 * Named `tl` (not `t`) so it never clashes with next-intl's `t` in components.
 */
export const tl = (
  val: Localized | null | undefined,
  locale: string,
  fallback: Locale = 'en',
): string =>
  val ? (val as Record<string, string>)[locale] || val[fallback] || '' : '';
