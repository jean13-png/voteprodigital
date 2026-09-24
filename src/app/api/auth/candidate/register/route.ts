import { NextRequest, NextResponse } from "next/server";
import { db, candidates } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logError } from "@/lib/log-error";

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nom, email, password } = body;

    if (!nom || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont requis." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Format email invalide." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Mot de passe trop court (min 8 caractères)." },
        { status: 400 }
      );
    }

    const slug = toSlug(nom.trim());

    const existingEmail = await db
      .select()
      .from(candidates)
      .where(eq(candidates.email, email));
    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: "Un candidat avec cet email existe déjà." },
        { status: 409 }
      );
    }

    const existingSlug = await db
      .select()
      .from(candidates)
      .where(eq(candidates.slug, slug));
    if (existingSlug.length > 0) {
      return NextResponse.json(
        { error: "Ce nom est déjà utilisé. Veuillez choisir un autre nom." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db
      .insert(candidates)
      .values({
        nom: nom.trim(),
        email: email.trim().toLowerCase(),
        slug,
        password: hashedPassword,
        domaine: "bureautique",
        actif: true,
      })
      .returning();

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 });
  } catch (err) {
    logError("Register candidate", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
