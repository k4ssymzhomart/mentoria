import { requireAdmin } from '@/lib/auth';
import { AdminNav } from '@/components/admin/admin-nav';

// Guards the admin area. Anyone who isn't an admin is redirected home.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr]">
      <AdminNav />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
