import { db, candidates } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { verifyResetToken } from "@/lib/reset-token";
import { checkRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/log-error";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return Response.json({ error: "Token et nouveau mot de passe requis." }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return Response.json({ error: "Mot de passe trop court (min 8 caractères)." }, { status: 400 });
    }

    // Rate limiting par token (prévenir brute force sur les tokens)
    const rateLimit = checkRateLimit(`reset-pwd:${token.substring(0, 10)}`, {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 5 tentatives par 15 minutes
    });

    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Trop de tentatives. Réessayez plus tard." },
        { status: 429 }
      );
    }

    const email = verifyResetToken(token);
    if (!email) {
      return Response.json({ error: "Token invalide ou expiré." }, { status: 400 });
    }

    const candidate = await db
      .select()
      .from(candidates)
      .where(eq(candidates.email, email));

    if (!candidate[0]) {
      return Response.json({ error: "Candidat introuvable." }, { status: 404 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await db
      .update(candidates)
      .set({ password: hashed, updatedAt: new Date() })
      .where(eq(candidates.id, candidate[0].id));

    return Response.json({ success: true });
  } catch (err) {
    logError("Reset password", err);
    return Response.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
