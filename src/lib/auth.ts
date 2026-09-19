import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users, candidates } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { generateCsrfToken } from "@/lib/csrf";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    // ─── Provider Admin ───────────────────────────────────────────────────────
    Credentials({
      id: "admin",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const result = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string));

        const user = result[0];
        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!passwordMatch) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: "admin",
        };
      },
    }),

    // ─── Provider Candidat ────────────────────────────────────────────────────
    Credentials({
      id: "candidate",
      name: "Candidat",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const result = await db
          .select()
          .from(candidates)
          .where(eq(candidates.email, credentials.email as string));

        const candidate = result[0];
        if (!candidate || !candidate.actif) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          candidate.password
        );
        if (!passwordMatch) return null;

        return {
          id: String(candidate.id),
          name: candidate.nom,
          email: candidate.email,
          role: "candidate",
          slug: candidate.slug,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.slug = (user as { slug?: string }).slug;
        token.id = user.id;
        token.csrfToken = generateCsrfToken();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.slug = token.slug as string | undefined;
      }
      session.csrfToken = token.csrfToken as string | undefined;
      return session;
    },
  },
});
