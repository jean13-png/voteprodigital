"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, isNotNull } from "drizzle-orm";
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

  const rows = await db
    .select({
      id: candidates.id,
      nom: candidates.nom,
      email: candidates.email,
    })
    .from(candidates)
    .where(isNotNull(candidates.email));

  let generated = 0;
  let sent = 0;

  for (const row of rows) {
    if (!row.email) continue;

    const password = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 12);

    await db
      .update(candidates)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, row.id));

    await sendCandidateCredentialsEmail({
      nom: row.nom,
      email: row.email,
      password,
      includePdf,
    });

    generated += 1;
    sent += 1;
  }

  revalidatePath("/admin/dashboard");
  redirect(`/admin/dashboard?credentials=generated&count=${generated}&sent=${sent}&pdf=${includePdf ? "1" : "0"}`);
}
