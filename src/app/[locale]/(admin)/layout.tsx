import { requireAdmin } from '@/lib/auth';

// Guards the admin area. Anyone who isn't an admin is redirected home.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return children;
}
