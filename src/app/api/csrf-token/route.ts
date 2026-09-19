import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCsrfFromCookie, CSRF_COOKIE } from "@/lib/csrf";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const token = getCsrfFromCookie();
  return NextResponse.json({ csrfToken: token });
}

export const dynamic = "force-dynamic";
