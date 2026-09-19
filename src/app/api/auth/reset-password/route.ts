import { db, candidates } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { verifyResetToken } from "@/lib/reset-token";

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
    console.error("Reset password error:", err);
    return Response.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
