import { getProfile } from '@/lib/auth';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { MainNav } from './main-nav';
import { MobileNav } from './mobile-nav';
import { UserMenu } from './user-menu';
import { SignInDialog } from './sign-in-dialog';

export async function Header() {
  const profile = await getProfile();
  const role = profile?.role ?? null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <MobileNav role={role} />

        <Link href="/" className="mr-1 flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-sm bg-foreground text-xs font-bold text-background">
            M
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Mentoria Hub
          </span>
        </Link>

        <MainNav role={role} />

        <div className="ml-auto flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
          {profile ? (
            <UserMenu
              name={profile.full_name}
              email={profile.email}
              avatarUrl={profile.avatar_url}
              role={profile.role}
            />
          ) : (
            <SignInDialog />
          )}
        </div>
      </div>
    </header>
  );
}
