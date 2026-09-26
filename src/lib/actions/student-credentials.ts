"use server";

import { revalidatePath } from "next/cache";
import { eq, isNotNull, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

import { db, candidates } from "@/db";
import { auth } from "@/lib/auth";
import { sendCandidateCredentialsEmail } from "@/lib/email";

function generateRandomPassword(): string {
  const segment = randomBytes(4).toString("hex").toUpperCase();
  return `PDC-${segment}`;
}

export async function generateCandidateCredentials(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Non autorisé");
  }

  const includePdf = formData.get("includePdf") === "true" || formData.get("includePdf") === "on";
  const scope = String(formData.get("scope") ?? "missing");

  // Récupérer tous les candidats avec email
  const rows = await db
    .select({
      id: candidates.id,
      nom: candidates.nom,
      email: candidates.email,
      password: candidates.password,
      generatedPassword: candidates.generatedPassword,
    })
    .from(candidates)
    .where(isNotNull(candidates.email));

  // Filtrer les candidats éligibles
  const eligibleRows = rows.filter((row) => {
    if (!row.email) return false;

    if (scope === "all") return true;
    // Générer pour ceux qui n'ont pas déjà identifiant ET mot de passe
    return !row.generatedPassword || !row.password;
  });

  let generated = 0;
  let sent = 0;

  // Générer les identifiants et mots de passe
  for (const row of eligibleRows) {
    if (!row.email) continue;

    const password = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 12);

    await db
      .update(candidates)
      .set({
        password: hashedPassword,
        generatedPassword: password,
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, row.id));

    // Envoyer l'email avec les identifiants
    try {
      await sendCandidateCredentialsEmail({
        nom: row.nom,
        email: row.email,
        password,
        includePdf,
      });
      sent += 1;
    } catch (error) {
      console.error(`Erreur envoi email pour ${row.nom}:`, error);
    }

    generated += 1;
  }

  revalidatePath("/admin/identifiants");
  
  // Retourner les stats au lieu de rediriger
  return {
    success: true,
    generated,
    sent,
    message: `${generated} identifiant(s) généré(s), ${sent} email(s) envoyé(s)`,
  };
}
