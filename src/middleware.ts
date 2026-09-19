import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
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

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/candidat/dashboard/:path*", "/candidat/profil/:path*"],
};
