import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

const JWT_COOKIE = "next-auth.session-token";

// Le secret doit être le même que celui utilisé par NextAuth dans auth.ts.
// NextAuth utilise AUTH_SECRET, avec fallback sur NEXTAUTH_SECRET.
function getAuthSecret(): string {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_COOKIE)?.value;
  if (!token) return null;

  const secret = getAuthSecret();
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));

    return {
      user: {
        id: payload.id as string,
        role: payload.role as string,
        slug: payload.slug as string | undefined,
      },
    };
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(JWT_COOKIE)?.value;
  if (!token) return null;

  const secret = getAuthSecret();
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));

    return {
      user: {
        id: payload.id as string,
        role: payload.role as string,
        slug: payload.slug as string | undefined,
      },
    };
  } catch {
    return null;
  }
}