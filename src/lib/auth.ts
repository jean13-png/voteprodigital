import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users, candidates } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { generateCsrfToken } from "@/lib/csrf";

function getRuntimeBaseUrl() {
  const configuredUrl =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";

  const trimmed = configuredUrl.trim();

  if (!trimmed) return "http://localhost:3000";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return `https://${trimmed}`;
}

const runtimeBaseUrl = getRuntimeBaseUrl();
if (!process.env.AUTH_URL) process.env.AUTH_URL = runtimeBaseUrl;
if (!process.env.NEXTAUTH_URL) process.env.NEXTAUTH_URL = runtimeBaseUrl;

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/admin/login",
  },
  basePath: "/api/auth",
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
        const start = Date.now();
        console.log('[NextAuth] admin.authorize start', { email: credentials?.email });
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('[NextAuth] admin.authorize missing credentials', { duration: Date.now() - start });
            return null;
          }

          const dbStart = Date.now();
          const result = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email as string));
          console.log('[NextAuth] admin.authorize dbQuery done', { duration: Date.now() - dbStart });

          const user = result[0];
          if (!user) {
            console.log('[NextAuth] admin.authorize user not found', { email: credentials?.email, duration: Date.now() - start });
            return null;
          }

          const bcryptStart = Date.now();
          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
          console.log('[NextAuth] admin.authorize bcrypt done', { duration: Date.now() - bcryptStart });

          if (!passwordMatch) {
            console.log('[NextAuth] admin.authorize password mismatch', { email: credentials?.email, duration: Date.now() - start });
            return null;
          }

          console.log('[NextAuth] admin.authorize success', { email: credentials?.email, duration: Date.now() - start });
          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
            role: "admin",
          };
        } catch (err) {
          console.error('[NextAuth] admin.authorize error', err, { duration: Date.now() - start });
          throw err;
        }
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
        const start = Date.now();
        console.log('[NextAuth] candidate.authorize start', { email: credentials?.email });
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('[NextAuth] candidate.authorize missing credentials', { duration: Date.now() - start });
            return null;
          }

          const dbStart = Date.now();
          const result = await db
            .select()
            .from(candidates)
            .where(eq(candidates.email, credentials.email as string));
          console.log('[NextAuth] candidate.authorize dbQuery done', { duration: Date.now() - dbStart });

          const candidate = result[0];
          if (!candidate || !candidate.actif) {
            console.log('[NextAuth] candidate.authorize not found or inactive', { email: credentials?.email, duration: Date.now() - start });
            return null;
          }

          const bcryptStart = Date.now();
          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            candidate.password
          );
          console.log('[NextAuth] candidate.authorize bcrypt done', { duration: Date.now() - bcryptStart });

          if (!passwordMatch) {
            console.log('[NextAuth] candidate.authorize password mismatch', { email: credentials?.email, duration: Date.now() - start });
            return null;
          }

          console.log('[NextAuth] candidate.authorize success', { email: credentials?.email, duration: Date.now() - start });
          return {
            id: String(candidate.id),
            name: candidate.nom,
            email: candidate.email,
            role: "candidate",
            slug: candidate.slug,
          };
        } catch (err) {
          console.error('[NextAuth] candidate.authorize error', err, { duration: Date.now() - start });
          throw err;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      console.log('[NextAuth] jwt callback', { user: user ? (user as any).email : undefined, token });
      if (user) {
        token.role = (user as { role?: string }).role;
        token.slug = (user as { slug?: string }).slug;
        token.id = user.id;
        token.csrfToken = generateCsrfToken();
      }
      return token;
    },
    async session({ session, token }) {
      console.log('[NextAuth] session callback', { sessionUser: session.user?.email, token });
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.slug = token.slug as string | undefined;
      }

      // @ts-ignore — csrfToken stocké dans le JWT, pas dans le type Session par défaut
      session.csrfToken = token.csrfToken;
      return session;
    },
  },
});
