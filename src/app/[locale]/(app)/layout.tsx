import { requireUser } from '@/lib/auth';

// Guards the authenticated student area. Signed-out users are redirected home.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return children;
}
