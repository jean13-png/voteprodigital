import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db, candidates } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logError } from "@/lib/log-error";

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user?.role !== "candidate") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      nom,
      email,
      bio,
      projectTitle,
      projectDescription,
      projectVideoUrl,
      projectImage,
      projectPosterImage,
      oldPassword,
      newPassword,
    } = body;
    const candidatId = parseInt(session.user.id);

    const existing = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidatId));

    if (!existing[0]) {
      return NextResponse.json({ error: "Candidat introuvable" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      nom: nom?.trim(),
      email: email?.trim().toLowerCase(),
      bio: bio?.trim() || null,
      projectTitle: projectTitle?.trim() || null,
      projectDescription: projectDescription?.trim() || null,
      projectVideoUrl: projectVideoUrl?.trim() || null,
      projectImage: projectImage?.trim() || null,
      projectPosterImage: projectPosterImage?.trim() || null,
      updatedAt: new Date(),
    };

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Format email invalide." }, { status: 400 });
    }

    // Changement de mot de passe
    if (oldPassword && newPassword) {
      const currentPassword = existing[0].password;
      if (!currentPassword || !(await bcrypt.compare(oldPassword, currentPassword))) {
        return NextResponse.json(
          { error: "Mot de passe actuel incorrect." },
          { status: 400 }
        );
      }
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "Le nouveau mot de passe doit contenir au moins 8 caractères." },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    await db
      .update(candidates)
      .set(updateData)
      .where(eq(candidates.id, candidatId));

    return NextResponse.json({ success: true });
  } catch (err) {
    logError("Profil update", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
