import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users, candidates } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const runtimeBaseUrl =
  process.env.AUTH_URL ??
  process.env.NEXTAUTH_URL ??
  process.env.VERCEL_URL ??
  "http://localhost:3000";

const trimmed = runtimeBaseUrl.trim();
const baseUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
if (!process.env.AUTH_URL) process.env.AUTH_URL = baseUrl;
if (!process.env.NEXTAUTH_URL) process.env.NEXTAUTH_URL = baseUrl;

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== "production",
  trustHost: true,
  basePath: "/api/auth",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    // Backwards-compatible credentials provider: some client flows post to
    // `/api/auth/callback/credentials`. Provide a catch-all `credentials`
    // provider that will authenticate either an admin (users) or a
    // candidate (candidates) by email/password.
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
          const email = credentials?.email as string | undefined;
          const password = credentials?.password as string | undefined;
          if (process.env.NODE_ENV !== "production") {
            console.log("[NextAuth][credentials] authorize start", { email: email ?? null });
          }
          if (!email || !password) {
            if (process.env.NODE_ENV !== "production") console.log("[NextAuth][credentials] missing email or password");
            return null;
          }

        // Try admin user first
        try {
          const u = await db.select().from(users).where(eq(users.email, email)).limit(1);
          const user = u[0];
          if (process.env.NODE_ENV !== "production") console.log("[NextAuth][credentials] admin lookup result", { user: user ?? null });
          if (user) {
            const ok = await bcrypt.compare(password, user.password);
            if (process.env.NODE_ENV !== "production") console.log("[NextAuth][credentials] admin bcrypt.compare result", { ok });
            if (ok) return { id: String(user.id), email: user.email, role: "admin" };
          }
        } catch (e) {
          console.error("[NextAuth] credentials.authorize user lookup error", e);
        }

        // Fallback to candidate
        try {
          const c = await db.select().from(candidates).where(eq(candidates.email, email)).limit(1);
          const candidate = c[0];
          if (process.env.NODE_ENV !== "production") console.log("[NextAuth][credentials] candidate lookup result", { candidate: candidate ?? null });
          if (candidate && candidate.password) {
            const ok = await bcrypt.compare(password, candidate.password);
            if (process.env.NODE_ENV !== "production") console.log("[NextAuth][credentials] candidate bcrypt.compare result", { ok });
            if (ok) return { id: String(candidate.id), email: candidate.email, role: "candidate" };
          }
        } catch (e) {
          console.error("[NextAuth] credentials.authorize candidate lookup error", e);
        }

        return null;
      },
    }),
    Credentials({
      id: "admin",
      name: "Admin",
      credentials: {
        email: { label: "Email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        try {
          const result = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          const user = result[0];
          if (!user) return null;

          const passwordValid = await bcrypt.compare(password, user.password);
          if (!passwordValid) return null;

          return {
            id: String(user.id),
            email: user.email,
            role: "admin",
          };
        } catch (err) {
          console.error("[NextAuth] admin.authorize error:", err);
          return null;
        }
      },
    }),
    Credentials({
      id: "candidate",
      name: "Candidate",
      credentials: {
        email: { label: "Email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const result = await db
          .select()
          .from(candidates)
          .where(eq(candidates.email, email))
          .limit(1);

        const candidate = result[0];
        if (!candidate || !candidate.password) return null;

        const passwordValid = await bcrypt.compare(password, candidate.password);
        if (!passwordValid) return null;

        return {
          id: String(candidate.id),
          email: candidate.email,
          role: "candidate",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[NextAuth] jwt callback", { token, user });
      }
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id as string;
        token.email = user.email as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[NextAuth] session callback", { session, token });
      }
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
