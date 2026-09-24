import AdminShell from "@/components/admin/AdminShell";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Le shell (sidebar) n'est affiché que lorsqu'un administrateur est
  // authentifié. La page /admin/login reste plein écran sans navigation.
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  if (!isAdmin) {
    return <>{children}</>;
  }

  return <AdminShell>{children}</AdminShell>;
}
