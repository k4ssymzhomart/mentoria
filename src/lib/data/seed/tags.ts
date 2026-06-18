import type { Tag } from '../types';

export const SEED_TAGS: Tag[] = [
  // directions
  { slug: 'stem',          kind: 'direction', sort: 1,  label: { en: 'STEM',           ru: 'STEM',                  kk: 'STEM' } },
  { slug: 'programming',   kind: 'direction', sort: 2,  label: { en: 'Programming',    ru: 'Программирование',      kk: 'Бағдарламалау' } },
  { slug: 'science',       kind: 'direction', sort: 3,  label: { en: 'Science',        ru: 'Наука',                 kk: 'Ғылым' } },
  { slug: 'business',      kind: 'direction', sort: 4,  label: { en: 'Business',       ru: 'Бизнес',                kk: 'Бизнес' } },
  { slug: 'finance',       kind: 'direction', sort: 5,  label: { en: 'Finance',        ru: 'Финансы',               kk: 'Қаржы' } },
  { slug: 'social-impact', kind: 'direction', sort: 6,  label: { en: 'Social Impact',  ru: 'Социальное влияние',    kk: 'Әлеуметтік ықпал' } },
  { slug: 'humanities',    kind: 'direction', sort: 7,  label: { en: 'Humanities',     ru: 'Гуманитарные науки',    kk: 'Гуманитарлық ғылымдар' } },
  { slug: 'arts',          kind: 'direction', sort: 8,  label: { en: 'Arts',           ru: 'Искусство',             kk: 'Өнер' } },
  // subjects
  { slug: 'math',          kind: 'subject',   sort: 10, label: { en: 'Mathematics',    ru: 'Математика',            kk: 'Математика' } },
  { slug: 'physics',       kind: 'subject',   sort: 11, label: { en: 'Physics',        ru: 'Физика',                kk: 'Физика' } },
  { slug: 'biology',       kind: 'subject',   sort: 12, label: { en: 'Biology',        ru: 'Биология',              kk: 'Биология' } },
  { slug: 'chemistry',     kind: 'subject',   sort: 13, label: { en: 'Chemistry',      ru: 'Химия',                 kk: 'Химия' } },
  { slug: 'cs',            kind: 'subject',   sort: 14, label: { en: 'Computer Science', ru: 'Информатика',         kk: 'Информатика' } },
  { slug: 'economics',     kind: 'subject',   sort: 15, label: { en: 'Economics',      ru: 'Экономика',             kk: 'Экономика' } },
  { slug: 'english',       kind: 'subject',   sort: 16, label: { en: 'English',        ru: 'Английский язык',       kk: 'Ағылшын тілі' } },
  { slug: 'sat',           kind: 'subject',   sort: 17, label: { en: 'SAT Prep',       ru: 'Подготовка к SAT',      kk: 'SAT дайындығы' } },
  { slug: 'ielts',         kind: 'subject',   sort: 18, label: { en: 'IELTS Prep',     ru: 'Подготовка к IELTS',    kk: 'IELTS дайындығы' } },
  { slug: 'admissions',    kind: 'subject',   sort: 19, label: { en: 'University Admissions', ru: 'Поступление в вуз', kk: 'Университетке түсу' } },
];
