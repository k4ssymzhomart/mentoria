import type { OpportunityType, OpportunityFormat, Localized } from '../types';

type Seed = {
  title: Localized;
  summary: Localized;
  description: Localized;
  requirements: Localized;
  type: OpportunityType;
  format: OpportunityFormat;
  tags: string[];
  grade_min: number;
  grade_max: number;
  deadline: string;
  location?: string;
  organizer?: string;
  apply_url?: string;
  featured?: boolean;
};

export const SEED_OPPORTUNITIES: Seed[] = [
  {
    title: { en: 'International Mathematical Olympiad (IMO)', ru: 'Международная математическая олимпиада (IMO)', kk: 'Халықаралық математикалық олимпиада (IMO)' },
    summary: { en: 'The world championship of high-school mathematics.', ru: 'Чемпионат мира по математике среди школьников.', kk: 'Мектеп математикасы бойынша әлем чемпионаты.' },
    description: { en: 'Six problems over two days; the most prestigious math competition for pre-university students.', ru: 'Шесть задач за два дня — самое престижное математическое соревнование для школьников.', kk: 'Екі күнде алты есеп — мектеп оқушыларына арналған ең беделді математикалық жарыс.' },
    requirements: { en: 'Selection through your national olympiad rounds.', ru: 'Отбор через национальные туры олимпиады.', kk: 'Ұлттық олимпиада турлары арқылы іріктеу.' },
    type: 'olympiad', format: 'offline', tags: ['stem', 'math'], grade_min: 9, grade_max: 11,
    deadline: '2026-12-01', organizer: 'IMO Foundation', apply_url: 'https://www.imo-official.org/', featured: true,
  },
  {
    title: { en: 'Regeneron ISEF', ru: 'Regeneron ISEF', kk: 'Regeneron ISEF' },
    summary: { en: 'The largest pre-college STEM research competition.', ru: 'Крупнейший STEM-конкурс научных проектов для школьников.', kk: 'Мектеп оқушыларына арналған ең ірі STEM зерттеу байқауы.' },
    description: { en: 'Present an original research project to a global panel; affiliated fairs feed the international final.', ru: 'Представьте оригинальный исследовательский проект международному жюри; отбор идёт через аффилированные конкурсы.', kk: 'Халықаралық қазылар алқасына түпнұсқа зерттеу жобасын ұсыныңыз.' },
    requirements: { en: 'Win a qualifying affiliated science fair.', ru: 'Победа в квалификационном научном конкурсе.', kk: 'Іріктеу ғылыми байқауында жеңіске жету.' },
    type: 'competition', format: 'offline', tags: ['stem', 'science', 'biology', 'chemistry', 'physics'], grade_min: 9, grade_max: 11,
    deadline: '2026-02-15', organizer: 'Society for Science', apply_url: 'https://www.societyforscience.org/isef/',
  },
  {
    title: { en: 'Yale Young Global Scholars', ru: 'Yale Young Global Scholars', kk: 'Yale Young Global Scholars' },
    summary: { en: 'Two-week interdisciplinary summer program at Yale.', ru: 'Двухнедельная междисциплинарная летняя программа в Йеле.', kk: 'Йельдегі екі апталық пәнаралық жазғы бағдарлама.' },
    description: { en: 'Live and learn on Yale’s campus across sessions in STEM, politics, and the humanities.', ru: 'Обучение в кампусе Йеля по направлениям STEM, политики и гуманитарных наук.', kk: 'Йель кампусында STEM, саясат және гуманитарлық бағыттар бойынша оқу.' },
    requirements: { en: 'Currently in grade 10 or 11; need-based aid available.', ru: 'Сейчас в 10–11 классе; доступна финансовая помощь.', kk: '10–11 сыныпта оқу; қаржылай көмек бар.' },
    type: 'summer_school', format: 'offline', tags: ['stem', 'humanities', 'social-impact', 'admissions'], grade_min: 10, grade_max: 11,
    deadline: '2026-01-10', location: 'New Haven, USA', organizer: 'Yale University', apply_url: 'https://globalscholars.yale.edu/', featured: true,
  },
  {
    title: { en: 'Technovation Girls', ru: 'Technovation Girls', kk: 'Technovation Girls' },
    summary: { en: 'Build a mobile app or AI project that solves a community problem.', ru: 'Создайте приложение или AI-проект, решающий проблему сообщества.', kk: 'Қоғам мәселесін шешетін қосымша немесе AI-жоба жасаңыз.' },
    description: { en: 'A global tech-entrepreneurship program for girls, ending in an international pitch.', ru: 'Глобальная программа технологического предпринимательства для девушек с финальным питчем.', kk: 'Қыздарға арналған жаһандық технологиялық кәсіпкерлік бағдарламасы.' },
    requirements: { en: 'Girls ages 8–18; form a team and find a mentor.', ru: 'Девушки 8–18 лет; команда и наставник.', kk: '8–18 жас аралығындағы қыздар; команда мен тәлімгер.' },
    type: 'competition', format: 'online', tags: ['programming', 'cs', 'business', 'social-impact'], grade_min: 8, grade_max: 11,
    deadline: '2026-03-01', organizer: 'Technovation', apply_url: 'https://www.technovation.org/',
  },
  {
    title: { en: 'Harvard Pre-College Program', ru: 'Harvard Pre-College Program', kk: 'Harvard Pre-College Program' },
    summary: { en: 'Two-week non-credit summer program for high schoolers.', ru: 'Двухнедельная летняя программа для старшеклассников.', kk: 'Жоғары сынып оқушыларына арналған екі апталық жазғы бағдарлама.' },
    description: { en: 'Study one immersive course on Harvard’s campus and experience college life.', ru: 'Один углублённый курс в кампусе Гарварда и опыт студенческой жизни.', kk: 'Гарвард кампусында бір тереңдетілген курс және студенттік өмір тәжірибесі.' },
    requirements: { en: 'Grades 10–11 in the year of the program.', ru: '10–11 класс на момент программы.', kk: 'Бағдарлама кезінде 10–11 сынып.' },
    type: 'summer_school', format: 'offline', tags: ['humanities', 'admissions', 'stem'], grade_min: 10, grade_max: 11,
    deadline: '2026-01-20', location: 'Cambridge, USA', organizer: 'Harvard University', apply_url: 'https://summer.harvard.edu/high-school-programs/',
  },
  {
    title: { en: 'nFactorial Incubator', ru: 'nFactorial Incubator', kk: 'nFactorial Incubator' },
    summary: { en: 'Intensive coding summer school in Almaty.', ru: 'Интенсивная летняя школа по программированию в Алматы.', kk: 'Алматыдағы қарқынды бағдарламалау жазғы мектебі.' },
    description: { en: 'Build and ship a real product in weeks alongside Kazakhstan’s top young developers.', ru: 'За несколько недель создайте реальный продукт вместе с лучшими молодыми разработчиками Казахстана.', kk: 'Бірнеше аптада Қазақстанның үздік жас әзірлеушілерімен бірге нақты өнім жасаңыз.' },
    requirements: { en: 'Basic programming; selection challenge.', ru: 'Базовое программирование; отборочное задание.', kk: 'Бағдарламалау негіздері; іріктеу тапсырмасы.' },
    type: 'summer_school', format: 'offline', tags: ['programming', 'cs', 'business'], grade_min: 10, grade_max: 11,
    deadline: '2026-05-01', location: 'Almaty, Kazakhstan', organizer: 'nFactorial', apply_url: 'https://www.nfactorial.school/', featured: true,
  },
  {
    title: { en: 'Republican Subject Olympiad', ru: 'Республиканская олимпиада по предметам', kk: 'Республикалық пәндік олимпиада' },
    summary: { en: 'Kazakhstan’s national academic olympiad.', ru: 'Национальная предметная олимпиада Казахстана.', kk: 'Қазақстанның ұлттық пәндік олимпиадасы.' },
    description: { en: 'School → regional → republican rounds across math, physics, biology, and more.', ru: 'Школьный → областной → республиканский этапы по математике, физике, биологии и др.', kk: 'Математика, физика, биология және басқа пәндер бойынша мектеп → облыстық → республикалық кезеңдер.' },
    requirements: { en: 'Enroll through your school.', ru: 'Регистрация через школу.', kk: 'Мектеп арқылы тіркелу.' },
    type: 'olympiad', format: 'hybrid', tags: ['stem', 'math', 'physics', 'biology', 'chemistry', 'humanities'], grade_min: 9, grade_max: 11,
    deadline: '2026-11-15', location: 'Kazakhstan', organizer: 'РНПЦ «Дарын»', apply_url: 'https://daryn.kz/',
  },
  {
    title: { en: 'Harvard Model United Nations', ru: 'Harvard Model United Nations', kk: 'Harvard Model United Nations' },
    summary: { en: 'The world’s largest and oldest college-run MUN.', ru: 'Крупнейшая и старейшая студенческая модель ООН.', kk: 'Әлемдегі ең ірі әрі көне студенттік БҰҰ үлгісі.' },
    description: { en: 'Debate global issues, draft resolutions, and practice diplomacy with delegates worldwide.', ru: 'Обсуждайте мировые проблемы, готовьте резолюции и практикуйте дипломатию с делегатами со всего мира.', kk: 'Жаһандық мәселелерді талқылап, қарарлар дайындап, дипломатияны жаттықтырыңыз.' },
    requirements: { en: 'Register as a delegation or individually.', ru: 'Регистрация делегацией или индивидуально.', kk: 'Делегация ретінде немесе жеке тіркелу.' },
    type: 'conference', format: 'offline', tags: ['social-impact', 'humanities', 'business'], grade_min: 9, grade_max: 11,
    deadline: '2026-10-01', organizer: 'Harvard University', apply_url: 'https://www.harvardmun.org/',
  },
  {
    title: { en: 'Pioneer Research Program', ru: 'Pioneer Research Program', kk: 'Pioneer Research Program' },
    summary: { en: 'Online research with a university professor.', ru: 'Онлайн-исследование под руководством профессора.', kk: 'Университет профессорымен онлайн зерттеу.' },
    description: { en: 'A selective online cohort producing an independent research paper across many disciplines.', ru: 'Селективная онлайн-программа с написанием самостоятельной научной работы по разным дисциплинам.', kk: 'Әртүрлі пәндер бойынша дербес ғылыми жұмыс жазатын іріктемелі онлайн бағдарлама.' },
    requirements: { en: 'Strong academics; application + transcript.', ru: 'Высокая успеваемость; заявка и транскрипт.', kk: 'Жоғары үлгерім; өтінім мен транскрипт.' },
    type: 'research', format: 'online', tags: ['stem', 'humanities', 'science', 'economics', 'social-impact'], grade_min: 10, grade_max: 11,
    deadline: '2026-04-01', organizer: 'Pioneer Academics', apply_url: 'https://pioneeracademics.com/',
  },
  {
    title: { en: 'Mentoria Global STEM Scholarship', ru: 'Стипендия Mentoria Global STEM', kk: 'Mentoria Global STEM шәкіртақысы' },
    summary: { en: 'Mentoria’s own scholarship for promising STEM students.', ru: 'Собственная стипендия Mentoria для перспективных STEM-учеников.', kk: 'Перспективалы STEM оқушыларына арналған Mentoria шәкіртақысы.' },
    description: { en: 'Covers course fees and mentorship for students showing exceptional drive in STEM.', ru: 'Покрывает оплату курсов и наставничество для самых целеустремлённых STEM-учеников.', kk: 'STEM-те ерекше ұмтылыс танытқан оқушыларға курс ақысы мен тәлімгерлікті қамтиды.' },
    requirements: { en: 'Essay + teacher recommendation; need-based.', ru: 'Эссе и рекомендация учителя; по уровню нуждаемости.', kk: 'Эссе және мұғалім ұсынысы; қажеттілікке негізделген.' },
    type: 'scholarship', format: 'online', tags: ['stem', 'finance', 'programming', 'science'], grade_min: 8, grade_max: 11,
    deadline: '2026-09-01', organizer: 'Mentoria', apply_url: 'https://example.com/mentoria-scholarship', featured: true,
  },
];
