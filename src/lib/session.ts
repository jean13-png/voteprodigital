import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";

const JWT_COOKIE = "next-auth.session-token";

export async function getSession(req: NextRequest) {
  const token = req.cookies.get(JWT_COOKIE)?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    if (!secret.length) return null;
    const { payload } = await jwtVerify(token, secret);

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
