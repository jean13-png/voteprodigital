import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateStore = new Map<string, RateLimitEntry>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/votes": { max: 5, windowMs: 10 * 60 * 1000 },
  "/api/auth": { max: 30, windowMs: 15 * 60 * 1000 },
};

function checkRateLimit(ip: string, path: string, method: string): NextResponse | null {
  if (method === "GET") return null;

  for (const [prefix, { max, windowMs }] of Object.entries(RATE_LIMITS)) {
    if (!path.startsWith(prefix)) continue;

    const key = `${ip}:${prefix}`;
    const now = Date.now();
    const entry = rateStore.get(key);

    if (!entry || now > entry.resetTime) {
      rateStore.set(key, { count: 1, resetTime: now + windowMs });
      return null;
    }

    entry.count++;
    if (entry.count > max) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans quelques minutes." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((entry.resetTime - now) / 1000)) } }
      );
    }
  }

  return null;
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (process.env.NODE_ENV === "production") {
    const url = req.nextUrl.clone();
    if (!req.headers.get("x-forwarded-proto")?.startsWith("https")) {
      url.protocol = "https";
      return NextResponse.redirect(url);
    }
  }

  const clientIP =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const rateLimitResponse = checkRateLimit(clientIP, pathname, req.method);
  if (rateLimitResponse) return rateLimitResponse;

  // ─── Protection espace admin ─────────────────────────────────────
  // /admin/login reste public ; le reste de /admin exige une session admin.
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // ─── Protection espace candidat ────────────────────────────────────
  if (pathname.startsWith("/candidat/login")) {
    return NextResponse.next();
  }
  if (
    pathname.startsWith("/candidat/dashboard") ||
    pathname.startsWith("/candidat/profil")
  ) {
    const session = await auth();
    if (!session?.user || session.user.role !== "candidate") {
      return NextResponse.redirect(new URL("/candidat/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
