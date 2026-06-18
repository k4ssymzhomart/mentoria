import type { Localized } from '../types';

const L = (en: string, ru: string, kk: string): Localized => ({ en, ru, kk });
const VIDEO = 'https://www.youtube.com/embed/ysz5S6PUM-U'; // placeholder embed

type QSeed = { id: string; prompt: Localized; options: { id: string; label: Localized }[]; correct: string };
type LessonSeed = {
  title: Localized;
  content_type: 'text' | 'video';
  video_url?: string;
  body: Localized;
  materials?: { label: Localized; url: string }[];
  duration_min?: number;
  quiz?: { title?: Localized; passing_score?: number; questions: QSeed[] };
};
type CourseSeed = {
  slug: string;
  title: Localized;
  summary: Localized;
  description: Localized;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  estimated_hours: number;
  lessons: LessonSeed[];
};

export const SEED_COURSES: CourseSeed[] = [
  // ─────────────────────────── 1) SAT EBRW ───────────────────────────
  {
    slug: 'sat-ebrw', subject: 'sat', difficulty: 'intermediate',
    tags: ['english', 'sat', 'admissions', 'humanities'], estimated_hours: 8,
    title: L('SAT EBRW: Evidence-Based Reading & Writing', 'SAT EBRW: чтение и письмо', 'SAT EBRW: оқу және жазу'),
    summary: L('Master the reading and writing half of the SAT.', 'Освойте чтение и письмо в SAT.', 'SAT-тің оқу және жазу бөлігін меңгеріңіз.'),
    description: L(
      'Strategies for reading comprehension, evidence, vocabulary in context, and grammar — with timed practice.',
      'Стратегии понимания текста, работы с доказательствами, лексики в контексте и грамматики с практикой на время.',
      'Мәтінді түсіну, дәлел, контекстегі лексика және грамматика стратегиялары — уақытқа жаттығумен.'),
    lessons: [
      {
        title: L('Overview & Scoring', 'Обзор и система баллов', 'Шолу және балл жүйесі'), content_type: 'video', video_url: VIDEO, duration_min: 15,
        body: L('How EBRW is structured, how it is scored, and how to plan your prep.',
          'Как устроен раздел EBRW, как он оценивается и как планировать подготовку.',
          'EBRW бөлімі қалай құрылған, қалай бағаланады және дайындықты қалай жоспарлау керек.'),
        materials: [{ label: L('Score chart (PDF)', 'Таблица баллов (PDF)', 'Балл кестесі (PDF)'), url: 'https://example.com/sat-scores.pdf' }],
        quiz: { passing_score: 70, questions: [
          { id: 'q1', prompt: L('What is the max EBRW score?', 'Максимальный балл EBRW?', 'EBRW максималды балы қандай?'),
            options: [{ id: 'a', label: L('800', '800', '800') }, { id: 'b', label: L('1600', '1600', '1600') }, { id: 'c', label: L('400', '400', '400') }], correct: 'a' },
          { id: 'q2', prompt: L('EBRW combines which two sections?', 'EBRW объединяет какие два раздела?', 'EBRW қай екі бөлімді біріктіреді?'),
            options: [{ id: 'a', label: L('Math & Reading', 'Математику и чтение', 'Математика мен оқу') }, { id: 'b', label: L('Reading & Writing', 'Чтение и письмо', 'Оқу мен жазу') }, { id: 'c', label: L('Essay & Math', 'Эссе и математику', 'Эссе мен математика') }], correct: 'b' },
        ] },
      },
      {
        title: L('Command of Evidence', 'Работа с доказательствами', 'Дәлелмен жұмыс'), content_type: 'text', duration_min: 20,
        body: L('Find lines in the passage that justify your answer; link claim and evidence.',
          'Находите строки в тексте, подтверждающие ваш ответ; связывайте утверждение и доказательство.',
          'Жауабыңызды растайтын жолдарды табыңыз; тұжырым мен дәлелді байланыстырыңыз.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('A “command of evidence” question asks you to…', 'Вопрос «command of evidence» просит…', '«Command of evidence» сұрағы нені сұрайды?'),
            options: [{ id: 'a', label: L('Guess the author’s mood', 'Угадать настроение автора', 'Автордың көңіл-күйін болжау') }, { id: 'b', label: L('Cite the line that supports an answer', 'Указать строку, подтверждающую ответ', 'Жауапты растайтын жолды көрсету') }], correct: 'b' },
          { id: 'q2', prompt: L('Best first step on a paired question?', 'Лучший первый шаг в парном вопросе?', 'Жұптық сұрақта ең дұрыс бірінші қадам?'),
            options: [{ id: 'a', label: L('Answer the first, then test evidence options', 'Ответить на первый, затем проверить варианты доказательств', 'Алдымен біріншісіне жауап беріп, дәлелдерді тексеру') }, { id: 'b', label: L('Skip both', 'Пропустить оба', 'Екеуін де өткізіп жіберу') }], correct: 'a' },
        ] },
      },
      {
        title: L('Words in Context', 'Лексика в контексте', 'Контекстегі лексика'), content_type: 'text', duration_min: 18,
        body: L('Choose word meanings based on the sentence, not the most common definition.',
          'Выбирайте значение слова по предложению, а не по самому частому определению.',
          'Сөздің мағынасын ең жиі анықтамаға емес, сөйлемге қарай таңдаңыз.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('Words-in-context answers depend on…', 'Ответы зависят от…', 'Жауаптар неге байланысты?'),
            options: [{ id: 'a', label: L('The surrounding sentence', 'Окружающего предложения', 'Қоршаған сөйлемге') }, { id: 'b', label: L('The dictionary’s first meaning', 'Первого значения в словаре', 'Сөздіктегі бірінші мағынаға') }], correct: 'a' },
          { id: 'q2', prompt: L('Good tactic before reading options?', 'Хорошая тактика до просмотра вариантов?', 'Нұсқаларды көрмес бұрын жақсы тәсіл?'),
            options: [{ id: 'a', label: L('Predict your own word', 'Предположить своё слово', 'Өз сөзіңізді болжау') }, { id: 'b', label: L('Pick the longest option', 'Выбрать самый длинный вариант', 'Ең ұзын нұсқаны таңдау') }], correct: 'a' },
        ] },
      },
      {
        title: L('Grammar Essentials', 'Основы грамматики', 'Грамматика негіздері'), content_type: 'text', duration_min: 22,
        body: L('Subject–verb agreement, punctuation, and concision — the highest-yield Writing rules.',
          'Согласование, пунктуация и лаконичность — самые ценные правила раздела Writing.',
          'Келісім, тыныс белгілері және ықшамдылық — Writing бөлімінің ең құнды ережелері.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('“The team ___ winning.” Correct verb?', '«The team ___ winning.» Верный глагол?', '«The team ___ winning.» Дұрыс етістік?'),
            options: [{ id: 'a', label: L('is', 'is', 'is') }, { id: 'b', label: L('are', 'are', 'are') }], correct: 'a' },
          { id: 'q2', prompt: L('SAT Writing usually prefers…', 'SAT Writing обычно предпочитает…', 'SAT Writing әдетте нені таңдайды?'),
            options: [{ id: 'a', label: L('The most concise correct option', 'Самый краткий верный вариант', 'Ең ықшам әрі дұрыс нұсқаны') }, { id: 'b', label: L('The wordiest option', 'Самый многословный вариант', 'Ең көпсөзді нұсқаны') }], correct: 'a' },
        ] },
      },
    ],
  },

  // ─────────────────────────── 2) IELTS ───────────────────────────
  {
    slug: 'ielts', subject: 'ielts', difficulty: 'intermediate',
    tags: ['english', 'ielts', 'admissions'], estimated_hours: 10,
    title: L('IELTS Academic: Band 7+', 'IELTS Academic: на 7+', 'IELTS Academic: 7+ балл'),
    summary: L('A focused path to a strong IELTS band.', 'Чёткий путь к высокому баллу IELTS.', 'IELTS-те жоғары балға нақты жол.'),
    description: L('Listening, reading, writing, and speaking strategies with band-descriptor breakdowns.',
      'Стратегии аудирования, чтения, письма и говорения с разбором критериев оценивания.',
      'Тыңдалым, оқылым, жазылым және сөйлеу стратегиялары — бағалау критерийлерін талдаумен.'),
    lessons: [
      {
        title: L('Format & Band Scores', 'Формат и баллы', 'Формат және балдар'), content_type: 'video', video_url: VIDEO, duration_min: 14,
        body: L('The four sections, timing, and what each band level means.', 'Четыре раздела, тайминг и значение каждого балла.', 'Төрт бөлім, уақыт және әр баллдың мәні.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('How many IELTS sections?', 'Сколько разделов в IELTS?', 'IELTS-те неше бөлім бар?'),
            options: [{ id: 'a', label: L('3', '3', '3') }, { id: 'b', label: L('4', '4', '4') }], correct: 'b' },
          { id: 'q2', prompt: L('Top band score is…', 'Максимальный балл…', 'Ең жоғары балл…'),
            options: [{ id: 'a', label: L('9.0', '9.0', '9.0') }, { id: 'b', label: L('10.0', '10.0', '10.0') }], correct: 'a' },
        ] },
      },
      {
        title: L('Listening Strategies', 'Стратегии аудирования', 'Тыңдалым стратегиялары'), content_type: 'text', duration_min: 20,
        body: L('Predict answers, follow signpost words, and watch spelling in your responses.', 'Предугадывайте ответы, следите за словами-маркерами и орфографией.', 'Жауаптарды болжаңыз, бағыттаушы сөздерді бақылаңыз, емлеге назар аударыңыз.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('Misspelled answers are…', 'Ответы с ошибкой…', 'Қате жазылған жауаптар…'),
            options: [{ id: 'a', label: L('Still correct', 'Всё равно верны', 'Бәрібір дұрыс') }, { id: 'b', label: L('Marked wrong', 'Считаются неверными', 'Қате деп есептеледі') }], correct: 'b' },
          { id: 'q2', prompt: L('“Signpost” words help you…', 'Слова-маркеры помогают…', 'Бағыттаушы сөздер неге көмектеседі?'),
            options: [{ id: 'a', label: L('Anticipate the next answer', 'Предугадать следующий ответ', 'Келесі жауапты болжауға') }, { id: 'b', label: L('Translate the audio', 'Перевести аудио', 'Аудионы аудару') }], correct: 'a' },
        ] },
      },
      {
        title: L('Reading: Skimming & Scanning', 'Чтение: беглый и поисковый', 'Оқу: жылдам әрі іздеп оқу'), content_type: 'text', duration_min: 20,
        body: L('Skim for gist, scan for keywords; do not read every word under time pressure.', 'Бегло — для сути, поисково — по ключевым словам; не читайте каждое слово.', 'Мәнін түсіну үшін жылдам, кілт сөздер үшін іздеп оқыңыз.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('Skimming is for…', 'Беглое чтение — для…', 'Жылдам оқу — не үшін?'),
            options: [{ id: 'a', label: L('Overall gist', 'Общей сути', 'Жалпы мәні') }, { id: 'b', label: L('Exact dates', 'Точных дат', 'Нақты күндер') }], correct: 'a' },
          { id: 'q2', prompt: L('Scanning is for…', 'Поисковое чтение — для…', 'Іздеп оқу — не үшін?'),
            options: [{ id: 'a', label: L('Specific keywords', 'Конкретных ключевых слов', 'Нақты кілт сөздер') }, { id: 'b', label: L('The author’s tone', 'Тона автора', 'Автор үні') }], correct: 'a' },
        ] },
      },
      {
        title: L('Writing Task 2: Essay Structure', 'Writing Task 2: структура эссе', 'Writing Task 2: эссе құрылымы'), content_type: 'text', duration_min: 24,
        body: L('Intro with a clear position, two body paragraphs with examples, concise conclusion.', 'Введение с чёткой позицией, два абзаца с примерами, краткий вывод.', 'Нақты ұстаным бар кіріспе, мысалы бар екі абзац, қысқа қорытынды.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('A Band 7 essay needs a clear…', 'Эссе на 7 требует чёткой…', '7 балдық эссеге не қажет?'),
            options: [{ id: 'a', label: L('Position & structure', 'Позиции и структуры', 'Ұстаным мен құрылым') }, { id: 'b', label: L('Rare vocabulary only', 'Только редкой лексики', 'Тек сирек лексика') }], correct: 'a' },
          { id: 'q2', prompt: L('Task 2 minimum word count?', 'Минимум слов в Task 2?', 'Task 2 минималды сөз саны?'),
            options: [{ id: 'a', label: L('150', '150', '150') }, { id: 'b', label: L('250', '250', '250') }], correct: 'b' },
        ] },
      },
    ],
  },

  // ─────────────────────────── 3) UNIVERSITY ADMISSIONS ───────────────────────────
  {
    slug: 'university-admissions', subject: 'admissions', difficulty: 'beginner',
    tags: ['admissions', 'humanities', 'social-impact'], estimated_hours: 6,
    title: L('University Admissions 101', 'Поступление в университет 101', 'Университетке түсу 101'),
    summary: L('Plan and present a competitive application.', 'Спланируйте и подайте конкурентную заявку.', 'Бәсекеге қабілетті өтінім жоспарлаңыз және ұсыныңыз.'),
    description: L('From building a profile to essays, recommendations, deadlines, and financial aid — for US/UK/EU/Asia.',
      'От построения профиля до эссе, рекомендаций, дедлайнов и финансовой помощи — для США/Великобритании/ЕС/Азии.',
      'Профиль құрудан эссе, ұсыныс, мерзім және қаржылай көмекке дейін — АҚШ/Ұлыбритания/ЕО/Азия.'),
    lessons: [
      {
        title: L('The Admissions Landscape', 'Карта поступления', 'Түсу картасы'), content_type: 'video', video_url: VIDEO, duration_min: 16,
        body: L('How systems differ across the US, UK, EU, and Asia, and how to choose targets.', 'Чем отличаются системы США, Великобритании, ЕС и Азии и как выбирать вузы.', 'АҚШ, Ұлыбритания, ЕО және Азия жүйелерінің айырмашылығы және мақсат таңдау.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('UK applications usually go through…', 'Заявки в Великобританию обычно через…', 'Ұлыбританияға өтінім әдетте қайдан өтеді?'),
            options: [{ id: 'a', label: L('UCAS', 'UCAS', 'UCAS') }, { id: 'b', label: L('The Common App', 'The Common App', 'The Common App') }], correct: 'a' },
          { id: 'q2', prompt: L('A balanced list mixes…', 'Сбалансированный список включает…', 'Теңгерімді тізімде не болады?'),
            options: [{ id: 'a', label: L('Reach, match, safety schools', 'Амбициозные, подходящие, запасные', 'Талапты, сәйкес, сақтық') }, { id: 'b', label: L('Only reach schools', 'Только амбициозные', 'Тек талапты') }], correct: 'a' },
        ] },
      },
      {
        title: L('Building a Profile', 'Построение профиля', 'Профиль құру'), content_type: 'text', duration_min: 18,
        body: L('Depth beats breadth: a few committed activities with real impact outshine a long shallow list.', 'Глубина важнее широты: несколько серьёзных активностей с реальным влиянием лучше длинного поверхностного списка.', 'Тереңдік ауқымнан маңызды: нақты ықпалы бар бірнеше белсенділік ұзын тізімнен жақсы.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('Admissions value activities that show…', 'Ценятся активности, показывающие…', 'Қандай белсенділік бағаланады?'),
            options: [{ id: 'a', label: L('Commitment & impact', 'Вовлечённость и влияние', 'Адалдық пен ықпал') }, { id: 'b', label: L('The longest list', 'Самый длинный список', 'Ең ұзын тізім') }], correct: 'a' },
          { id: 'q2', prompt: L('“Depth over breadth” means…', '«Глубина важнее широты» —', '«Тереңдік ауқымнан маңызды» —'),
            options: [{ id: 'a', label: L('Focus on a few areas deeply', 'Глубоко в нескольких сферах', 'Бірнеше салаға терең үңілу') }, { id: 'b', label: L('Try everything once', 'Попробовать всё по разу', 'Бәрін бір рет көру') }], correct: 'a' },
        ] },
      },
      {
        title: L('The Personal Essay', 'Личное эссе', 'Жеке эссе'), content_type: 'text', duration_min: 22,
        body: L('Tell one specific story in your own voice; show growth rather than listing achievements.', 'Расскажите одну конкретную историю своим голосом; покажите рост, а не список достижений.', 'Өз даусыңызбен бір нақты оқиға айтыңыз; жетістік тізбесінің орнына өсуді көрсетіңіз.'),
        quiz: { questions: [
          { id: 'q1', prompt: L('A strong essay focuses on…', 'Сильное эссе сосредоточено на…', 'Күшті эссе неге бағытталады?'),
            options: [{ id: 'a', label: L('One specific, personal story', 'Одной конкретной личной истории', 'Бір нақты жеке оқиғаға') }, { id: 'b', label: L('A résumé in prose', 'Резюме в виде текста', 'Мәтін түріндегі түйіндеме') }], correct: 'a' },
          { id: 'q2', prompt: L('Best essays demonstrate…', 'Лучшие эссе показывают…', 'Үздік эссе нені көрсетеді?'),
            options: [{ id: 'a', label: L('Reflection and growth', 'Рефлексию и рост', 'Рефлексия мен өсу') }, { id: 'b', label: L('Big words', 'Сложные слова', 'Күрделі сөздер') }], correct: 'a' },
        ] },
      },
    ],
  },
];
