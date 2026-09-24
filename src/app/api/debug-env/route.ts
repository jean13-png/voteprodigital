import { NextResponse } from "next/server";
import { auth, signIn } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email") ?? "";
    const password = url.searchParams.get("password") ?? "";

    if (!email || !password) {
      return NextResponse.json({
        hasSession: false,
        AUTH_URL: process.env.AUTH_URL ?? "not set",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "not set",
        AUTH_SECRET: process.env.AUTH_SECRET ? "set" : "not set",
      });
    }

    const result = await signIn("admin", {
      email,
      password,
      redirect: false,
    });

    return NextResponse.json({
      result,
      error: (result as any)?.error,
      ok: (result as any)?.ok,
      hasSession: !!(result as any)?.ok,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err), message: err instanceof Error ? err.message : "unknown" });
  }
}
