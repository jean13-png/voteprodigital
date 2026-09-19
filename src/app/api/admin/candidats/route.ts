import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, candidates } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { logError } from "@/lib/log-error";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    const nom = (formData.get("nom") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const slug = (formData.get("slug") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const bio = (formData.get("bio") as string)?.trim() || null;
    const domaine = formData.get("domaine") as string;
    const videoUrl = (formData.get("videoUrl") as string)?.trim() || null;
    const photoFile = formData.get("photo") as File | null;

    if (!nom || !email || !slug || !password || !domaine) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Format email invalide." },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug invalide (lettres, chiffres et tirets uniquement)." },
        { status: 400 }
      );
    }

    // Vérifier unicité email + slug
    const existing = await db
      .select()
      .from(candidates)
      .where(eq(candidates.email, email));
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Un candidat avec cet email existe déjà." },
        { status: 400 }
      );
    }

    const existingSlug = await db
      .select()
      .from(candidates)
      .where(eq(candidates.slug, slug));
    if (existingSlug.length > 0) {
      return NextResponse.json(
        { error: "Ce slug est déjà utilisé." },
        { status: 400 }
      );
    }

    // Upload photo
    let photoUrl: string | null = null;
    if (photoFile && photoFile.size > 0 && isCloudinaryConfigured()) {
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      photoUrl = await uploadToCloudinary(buffer, "prodigital_candidats", slug);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db
      .insert(candidates)
      .values({
        nom,
        email,
        slug,
        password: hashedPassword,
        bio,
        domaine: domaine as "bureautique" | "graphisme" | "developpement_web" | "ecommerce" | "audiovisuel",
        videoUrl,
        photo: photoUrl,
        actif: true,
      })
      .returning();

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 });
  } catch (err) {
    logError("Create candidate", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
