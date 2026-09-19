import { db, candidates } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createResetToken } from "@/lib/reset-token";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Email invalide." }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(candidates)
      .where(eq(candidates.email, email));

    if (!existing[0]) {
      return Response.json({ error: "Email non trouvé." }, { status: 404 });
    }

    const token = createResetToken(email);
    await sendPasswordResetEmail(email, token);

    return Response.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return Response.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
