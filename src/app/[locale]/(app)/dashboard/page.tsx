import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { CalendarDays, Map as MapIcon } from 'lucide-react';
import { db } from '@/lib/data/provider';
import { getAuthUserId, requireOnboarding } from '@/lib/auth';
import { tl } from '@/lib/data/types';
import type { Course, CourseWithLessons, Opportunity, Tag } from '@/lib/data/types';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { nextIncompleteLesson } from '@/lib/courses/format';
import { describeDeadline } from '@/lib/opportunities/format';
import { interestVector, overlapLabels } from '@/lib/personalization/recommend';
import { OpportunityCard } from '@/components/opportunities/opportunity-card';
import { CourseCard, type CardEnrollment } from '@/components/courses/course-card';
import { Section } from '@/components/dashboard/section';
import { StatStrip } from '@/components/dashboard/stat-strip';
import { Why } from '@/components/dashboard/why';
import { DeadlineList } from '@/components/dashboard/deadline-list';
import { CertificateWall } from '@/components/dashboard/certificate-wall';
import { EmptyNudge } from '@/components/dashboard/empty-nudge';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const profile = await requireOnboarding();

  const t = await getTranslations('dashboard');
  const activeLocale = await getLocale();
  const userId = await getAuthUserId();

  const [tags, baseCourses, enrollments, saved, certs] = await Promise.all([
    db.getTags(),
    db.listCourses(),
    userId ? db.listEnrollments(userId) : Promise.resolve([]),
    userId ? db.listSaved(userId) : Promise.resolve([]),
    userId ? db.listCertificates(userId) : Promise.resolve([]),
  ]);
  const tagMap = new Map(tags.map((tag: Tag) => [tag.slug, tag]));
  const savedSet = new Set(saved.map((s) => s.opportunity_id));

  // Detailed courses (with lessons) keyed by id — for counts + resume targets.
  const detailed = (await Promise.all(baseCourses.map((c) => db.getCourseBySlug(c.slug)))).filter(
    (c): c is CourseWithLessons => Boolean(c),
  );
  const courseById = new Map(detailed.map((c) => [c.id, c]));

  // Per-enrolled-course progress + resume lesson.
  const enrolledMap = new Map<string, CardEnrollment>();
  if (userId) {
    await Promise.all(
      enrollments.map(async (e) => {
        const course = courseById.get(e.course.id);
        const completedIds = course ? await db.getCompletedLessonIds(userId, e.course.id) : [];
        enrolledMap.set(e.course.id, {
          pct: e.pct,
          completed: e.completed,
          total: e.total,
          resumeLessonId: course ? nextIncompleteLesson(course.lessons, completedIds)?.id ?? null : null,
        });
      }),
    );
  }

  // Recommendations (deterministic; empty vector → the RPC's newest/featured fallback).
  const vector = interestVector(profile);
  const [recOpps, recCourses] = await Promise.all([
    db.recommendOpportunities(vector, profile.grade, 6),
    db.recommendCourses(vector, 6),
  ]);

  const firstName = (profile.full_name || profile.email || '').split(/[\s@]/)[0] || '';
  const greeting = firstName ? t('greeting', { name: firstName }) : t('greetingNoName');

  const continueLearning = enrollments.filter((e) => e.pct < 100);
  const upcoming = saved
    .map((s) => s.opportunity)
    .filter((o): o is Opportunity => Boolean(o && o.deadline))
    .filter((o) => {
      const k = describeDeadline(o.deadline).kind;
      return k !== 'passed' && k !== 'none';
    })
    .sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? ''))
    .slice(0, 5);
  const savedOpps = saved.map((s) => s.opportunity).filter((o): o is Opportunity => Boolean(o)).slice(0, 4);
  const certCards = certs.map((c) => ({
    serial: c.serial,
    courseTitle: tl(courseById.get(c.course_id)?.title, activeLocale),
  }));

  const firstRun = enrollments.length === 0 && saved.length === 0 && certs.length === 0;

  const courseCard = (course: Course | CourseWithLessons) => {
    const d = courseById.get(course.id);
    return (
      <CourseCard
        key={course.id}
        course={course}
        lessonCount={d?.lessons.length ?? 0}
        estimatedHours={course.estimated_hours}
        firstLessonId={d?.lessons[0]?.id ?? null}
        tagMap={tagMap}
        enrollment={enrolledMap.get(course.id) ?? null}
        canEnroll={Boolean(userId)}
      />
    );
  };

  const recommendedSection = (
    <Section title={t('recommended.title')}>
      <div className="space-y-6">
        {recOpps.length ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">{t('recommended.opportunities')}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recOpps.slice(0, 3).map((opp) => (
                <div key={opp.id}>
                  <OpportunityCard opp={opp} tagMap={tagMap} saved={savedSet.has(opp.id)} canSave={Boolean(userId)} />
                  <Why labels={overlapLabels(opp.tags, vector, tagMap, activeLocale)} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {recCourses.length ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">{t('recommended.courses')}</h3>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recCourses.slice(0, 3).map((course) => (
                <div key={course.id}>
                  {courseCard(course)}
                  <Why labels={overlapLabels(course.tags, vector, tagMap, activeLocale)} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Section>
  );

  const quickLinks = (
    <div className="grid gap-3 sm:grid-cols-2">
      <Button variant="outline" className="h-auto justify-start gap-3 p-4" render={<Link href="/calendar" />}>
        <CalendarDays className="size-5" />
        {t('quickLinks.calendar')}
      </Button>
      <Button variant="outline" className="h-auto justify-start gap-3 p-4" render={<Link href="/roadmap" />}>
        <MapIcon className="size-5" />
        {t('quickLinks.roadmap')}
      </Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{greeting}</h1>
        <p className="text-muted-foreground">{firstRun ? t('firstRun.subtitle') : t('subtitle')}</p>
      </header>

      <StatStrip
        stats={[
          { label: t('stats.inProgress'), value: continueLearning.length },
          { label: t('stats.lessons'), value: enrollments.reduce((a, e) => a + e.completed, 0) },
          { label: t('stats.certificates'), value: certs.length },
          { label: t('stats.saved'), value: saved.length },
        ]}
      />

      {firstRun ? (
        <>
          {recommendedSection}
          <div className="flex flex-wrap gap-3">
            <Button render={<Link href="/opportunities" />}>{t('recommended.browseOpps')}</Button>
            <Button variant="outline" render={<Link href="/courses" />}>{t('recommended.startCourse')}</Button>
          </div>
          {quickLinks}
        </>
      ) : (
        <>
          <Section title={t('continueLearning.title')}>
            {continueLearning.length ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {continueLearning.slice(0, 3).map((e) => courseCard(e.course))}
              </div>
            ) : (
              <EmptyNudge text={t('continueLearning.empty')} cta={{ href: '/courses', label: t('continueLearning.browse') }} />
            )}
          </Section>

          <Section
            title={t('deadlines.title')}
            action={upcoming.length ? { href: '/calendar', label: t('deadlines.viewCalendar') } : undefined}
          >
            {upcoming.length ? (
              <DeadlineList items={upcoming} />
            ) : (
              <EmptyNudge text={t('deadlines.empty')} cta={{ href: '/opportunities', label: t('deadlines.browse') }} />
            )}
          </Section>

          {recommendedSection}

          {savedOpps.length ? (
            <Section title={t('saved.title')} action={{ href: '/opportunities', label: t('saved.viewAll') }}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {savedOpps.map((opp) => (
                  <OpportunityCard key={opp.id} opp={opp} tagMap={tagMap} saved canSave={Boolean(userId)} />
                ))}
              </div>
            </Section>
          ) : null}

          {certCards.length ? (
            <Section title={t('certificates.title')}>
              <CertificateWall certs={certCards} />
            </Section>
          ) : null}

          {quickLinks}
        </>
      )}
    </div>
  );
}
