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

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // ─── Protection espace admin ──────────────────────────────────────────────
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!session || session.user?.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // ─── Protection espace candidat ───────────────────────────────────────────
  if (
    pathname.startsWith("/candidat/dashboard") ||
    pathname.startsWith("/candidat/profil")
  ) {
    if (!session || session.user?.role !== "candidate") {
      return NextResponse.redirect(new URL("/candidat/login", req.url));
    }
  }

  // ─── Redirection si déjà connecté ────────────────────────────────────────
  if (pathname === "/admin/login" && session?.user?.role === "admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  if (pathname === "/candidat/login" && session?.user?.role === "candidate") {
    return NextResponse.redirect(new URL("/candidat/dashboard", req.url));
  }

  // ─── CSRF : définir le cookie si absent ──────────────────────────────────
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

  // ─── CSRF : vérifier sur les mutations ──────────────────────────────────
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

  return response;
});

export const config = {
  matcher: ["/:path*"],
};
