import { auth } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  // Page login : pas de sidebar, juste le contenu centré
  if (!isAdmin) {
    return <>{children}</>;
  }

  return <AdminShell>{children}</AdminShell>;
}
