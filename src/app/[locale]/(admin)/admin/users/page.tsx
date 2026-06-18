import { getTranslations, setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/data/provider';

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('admin');
  const users = await db.adminListUsers();
  const dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('users.title')}</h1>
        <p className="text-muted-foreground">{t('users.subtitle')}</p>
      </header>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">{t('users.name')}</th>
              <th className="px-3 py-2 font-medium">{t('users.email')}</th>
              <th className="px-3 py-2 font-medium">{t('users.role')}</th>
              <th className="px-3 py-2 font-medium">{t('users.grade')}</th>
              <th className="px-3 py-2 font-medium">{t('users.onboarded')}</th>
              <th className="px-3 py-2 font-medium">{t('users.joined')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-3 py-3 font-medium">{user.full_name || '—'}</td>
                <td className="px-3 py-3 text-muted-foreground">{user.email || '—'}</td>
                <td className="px-3 py-3">
                  <span className="rounded-full border px-2 py-0.5 text-xs">{user.role}</span>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{user.grade ?? '—'}</td>
                <td className="px-3 py-3 text-muted-foreground">
                  {user.onboarded ? t('common.yes') : t('common.no')}
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {dateFmt.format(new Date(user.created_at))}
                </td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                  {t('empty.users')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
