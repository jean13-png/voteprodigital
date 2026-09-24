import { db, candidates } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createResetToken } from "@/lib/reset-token";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/log-error";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Email invalide." }, { status: 400 });
    }

    // Rate limiting par email
    const rateLimit = checkRateLimit(`forgot-pwd:${email}`, {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 3 tentatives par heure
    });

    if (!rateLimit.allowed) {
      const minutesLeft = Math.ceil((rateLimit.resetTime - Date.now()) / 60000);
      return Response.json(
        { error: `Trop de tentatives. Réessayez dans ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.` },
        { status: 429 }
      );
    }

    const existing = await db
      .select()
      .from(candidates)
      .where(eq(candidates.email, email));

    if (!existing[0]) {
      // Don't reveal if email exists (security)
      return Response.json({ success: true });
    }

    const token = createResetToken(email);
    await sendPasswordResetEmail(email, token);

    return Response.json({ success: true });
  } catch (err) {
    logError("Forgot password", err);
    return Response.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
