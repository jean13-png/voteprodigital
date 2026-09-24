import { NextResponse } from "next/server";

// Compatibility shim: redirect older /api/auth/csrf-token requests to the
// official NextAuth endpoint /api/auth/csrf so NextAuth can set its CSRF
// cookie and respond normally.
export async function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = url.pathname.replace("/csrf-token", "/csrf");
  return NextResponse.redirect(url, 307);
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  url.pathname = url.pathname.replace("/csrf-token", "/csrf");
  return NextResponse.redirect(url, 307);
}
