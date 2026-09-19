import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  CSRF_COOKIE,
  CSRF_HEADER,
  generateCsrfToken,
  verifyCsrf,
} from "@/lib/csrf";

const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateStore = new Map<string, RateLimitEntry>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/votes": { max: 5, windowMs: 10 * 60 * 1000 },
  "/api/auth": { max: 5, windowMs: 15 * 60 * 1000 },
  "/api/admin": { max: 30, windowMs: 10 * 60 * 1000 },
};

function checkRateLimit(ip: string, path: string): NextResponse | null {
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

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

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

  const rateLimitResponse = checkRateLimit(clientIP, pathname);
  if (rateLimitResponse) return rateLimitResponse;

  // ─── Protection espace admin ──────────────────────────────────────
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!session || session.user?.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // ─── Protection espace candidat ───────────────────────────────────
  if (
    pathname.startsWith("/candidat/dashboard") ||
    pathname.startsWith("/candidat/profil")
  ) {
    if (!session || session.user?.role !== "candidate") {
      return NextResponse.redirect(new URL("/candidat/login", req.url));
    }
  }

  // ─── Redirection si déjà connecté ────────────────────────────────
  if (pathname === "/admin/login" && session?.user?.role === "admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  if (pathname === "/candidat/login" && session?.user?.role === "candidate") {
    return NextResponse.redirect(new URL("/candidat/dashboard", req.url));
  }

  // ─── CSRF : définir le cookie si absent ──────────────────────────
  const existingCookie = req.cookies.get(CSRF_COOKIE)?.value;
  const response = NextResponse.next();
  if (!existingCookie) {
    response.cookies.set(CSRF_COOKIE, generateCsrfToken(), {
      httpOnly: false,
      sameSite: "strict",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
  }

  // ─── CSRF : vérifier sur les mutations ──────────────────────────
  if (MUTATING_METHODS.includes(req.method)) {
    if (
      !pathname.startsWith("/api/auth") &&
      !pathname.startsWith("/api/webhook")
    ) {
      const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
      const headerToken = req.headers.get(CSRF_HEADER);
      if (!verifyCsrf(headerToken, cookieToken)) {
        return NextResponse.json(
          { error: "Token CSRF invalide ou absent." },
          { status: 403 }
        );
      }
    }
  }

  // ─── Security headers (production) ──────────────────────────
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
    response.headers.set(
      "X-Content-Type-Options",
      "nosniff"
    );
    response.headers.set(
      "X-Frame-Options",
      "DENY"
    );
  }

  return response;
});

export const config = {
  matcher: ["/:path*"],
};
