import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db, candidates } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { uploadToCloudinary, isCloudinaryConfigured, deleteFromCloudinary, validateImageFile } from "@/lib/cloudinary";
import { logError } from "@/lib/log-error";
import { auditLog } from "@/lib/audit-log";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const candidatId = parseInt(id);

  try {
    const formData = await req.formData();

    const nom = (formData.get("nom") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const slug = (formData.get("slug") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string | null;
    const bio = (formData.get("bio") as string)?.trim() || null;
    const domaine = formData.get("domaine") as string;
    const videoUrl = (formData.get("videoUrl") as string)?.trim() || null;
    const projectTitle = (formData.get("projectTitle") as string)?.trim() || null;
    const projectDescription = (formData.get("projectDescription") as string)?.trim() || null;
    const projectVideoUrl = (formData.get("projectVideoUrl") as string)?.trim() || null;
    const projectImage = (formData.get("projectImage") as string)?.trim() || null;
    const projectPosterImage = (formData.get("projectPosterImage") as string)?.trim() || null;
    const projectLinks = (formData.get("projectLinks") as string)?.trim() || null;
    const photoFile = formData.get("photo") as File | null;
    const projectImageFile = formData.get("projectImageFile") as File | null;
    const projectPosterImageFile = formData.get("projectPosterImageFile") as File | null;

    let resolvedProjectImage = projectImage;
    let resolvedProjectPosterImage = projectPosterImage;

    const updateData: Record<string, unknown> = {
      nom,
      email,
      slug,
      bio,
      domaine,
      videoUrl,
      projectTitle,
      projectDescription,
      projectVideoUrl,
      projectImage,
      projectPosterImage,
      projectLinks,
      updatedAt: new Date(),
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    if (photoFile && photoFile.size > 0) {
      if (isCloudinaryConfigured()) {
        const validation = validateImageFile(photoFile);
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const buffer = Buffer.from(await photoFile.arrayBuffer());
        updateData.photo = await uploadToCloudinary(
          buffer,
          "prodigital_candidats",
          `${slug}_${Date.now()}`
        );
      }
    }

    if (projectImageFile && projectImageFile.size > 0) {
      if (isCloudinaryConfigured()) {
        const validation = validateImageFile(projectImageFile);
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const buffer = Buffer.from(await projectImageFile.arrayBuffer());
        resolvedProjectImage = await uploadToCloudinary(
          buffer,
          "prodigital_projects",
          `${slug}_project_${Date.now()}`
        );
      }
    }

    if (projectPosterImageFile && projectPosterImageFile.size > 0) {
      if (isCloudinaryConfigured()) {
        const validation = validateImageFile(projectPosterImageFile);
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const buffer = Buffer.from(await projectPosterImageFile.arrayBuffer());
        resolvedProjectPosterImage = await uploadToCloudinary(
          buffer,
          "prodigital_projects",
          `${slug}_poster_${Date.now()}`
        );
      }
    }

    updateData.projectImage = resolvedProjectImage;
    updateData.projectPosterImage = resolvedProjectPosterImage;

    await db
      .update(candidates)
      .set(updateData)
      .where(eq(candidates.id, candidatId));

    return NextResponse.json({ success: true });
  } catch (err) {
    logError("Update candidate", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const candidatId = parseInt(id);

  const existing = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, candidatId));
  const candidat = existing[0];

  if (candidat?.photo) {
    await deleteFromCloudinary(candidat.photo);
  }

  await db.delete(candidates).where(eq(candidates.id, candidatId));

  await auditLog({
    adminId: parseInt(session.user.id),
    action: "delete_candidate",
    targetType: "candidate",
    targetId: candidatId,
    details: `nom=${candidat?.nom}`,
  });

  return NextResponse.json({ success: true });
}
