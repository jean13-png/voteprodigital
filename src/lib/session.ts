import { auth } from "@/lib/auth";

export async function getSession() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return {
    user: {
      id: session.user.id as string,
      role: session.user.role as string,
      slug: (session.user as { slug?: string }).slug,
    },
  };
}
