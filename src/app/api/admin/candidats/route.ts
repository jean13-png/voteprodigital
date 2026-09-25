import { NextRequest, NextResponse } from "next/server";
import { db, candidates } from "@/db";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { uploadToCloudinary, isCloudinaryConfigured, validateImageFile } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  console.log("[POST /api/admin/candidats-simple] DEBUT");
  
  // Vérification session
  const session = await getSession();
  console.log("[POST /api/admin/candidats-simple] Session:", !!session);
  
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  
  try {
    const formData = await req.formData();
    
    const nom = (formData.get("nom") as string)?.trim();
    const slug = (formData.get("slug") as string)?.trim().toLowerCase();
    const emailRaw = (formData.get("email") as string)?.trim();
    const email = emailRaw || null;
    const password = (formData.get("password") as string) || null;
    const domaine = (formData.get("domaine") as string)?.trim();
    const bioRaw = (formData.get("bio") as string)?.trim();
    const bio = bioRaw || null;
    const videoUrlRaw = (formData.get("videoUrl") as string)?.trim();
    const videoUrl = videoUrlRaw || null;
    const projectTitleRaw = (formData.get("projectTitle") as string)?.trim();
    const projectTitle = projectTitleRaw || null;
    const projectDescriptionRaw = (formData.get("projectDescription") as string)?.trim();
    const projectDescription = projectDescriptionRaw || null;
    const projectVideoUrlRaw = (formData.get("projectVideoUrl") as string)?.trim();
    const projectVideoUrl = projectVideoUrlRaw || null;
    const projectImageRaw = (formData.get("projectImage") as string)?.trim();
    const projectImage = projectImageRaw || null;
    const projectPosterImageRaw = (formData.get("projectPosterImage") as string)?.trim();
    const projectPosterImage = projectPosterImageRaw || null;
    const projectLinksRaw = (formData.get("projectLinks") as string)?.trim();
    const projectLinks = projectLinksRaw || null;
    const photoFile = formData.get("photo") as File | null;
    const projectImageFile = formData.get("projectImageFile") as File | null;
    const projectPosterImageFile = formData.get("projectPosterImageFile") as File | null;
    
    console.log("[POST /api/admin/candidats-simple] Données:", { nom, slug, domaine, hasPhoto: !!photoFile, projectTitle });
    
    if (!nom || !slug || !domaine) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }
    
    // Upload photo si fournie
    let photoUrl: string | null = null;
    if (photoFile && photoFile.size > 0) {
      console.log("[POST /api/admin/candidats-simple] Upload photo...");
      
      if (isCloudinaryConfigured()) {
        const validation = validateImageFile(photoFile);
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        
        try {
          const buffer = Buffer.from(await photoFile.arrayBuffer());
          photoUrl = await uploadToCloudinary(buffer, "prodigital_candidats", slug);
          console.log("[POST /api/admin/candidats-simple] Photo uploadée:", photoUrl);
        } catch (uploadErr) {
          // Upload échoué : on continue sans photo plutôt que de bloquer
          console.error("[POST /api/admin/candidats-simple] Upload photo échoué, candidat créé sans photo:", uploadErr);
        }
      }
    }
    
    // Hash password si fourni
    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;
    console.log("[POST /api/admin/candidats-simple] Password hashé:", !!hashedPassword);

    let resolvedProjectImage = projectImage;
    let resolvedProjectPosterImage = projectPosterImage;

    if (projectImageFile && projectImageFile.size > 0) {
      if (isCloudinaryConfigured()) {
        const validation = validateImageFile(projectImageFile);
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const buffer = Buffer.from(await projectImageFile.arrayBuffer());
        resolvedProjectImage = await uploadToCloudinary(buffer, "prodigital_projects", `${slug}_project_${Date.now()}`);
      }
    }

    if (projectPosterImageFile && projectPosterImageFile.size > 0) {
      if (isCloudinaryConfigured()) {
        const validation = validateImageFile(projectPosterImageFile);
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const buffer = Buffer.from(await projectPosterImageFile.arrayBuffer());
        resolvedProjectPosterImage = await uploadToCloudinary(buffer, "prodigital_projects", `${slug}_poster_${Date.now()}`);
      }
    }
    
    // Insertion en base
    const result = await db.insert(candidates).values({
      nom,
      slug,
      email,
      password: hashedPassword,
      domaine: domaine as any,
      bio,
      videoUrl,
      projectTitle,
      projectDescription,
      projectVideoUrl,
      projectImage: resolvedProjectImage,
      projectPosterImage: resolvedProjectPosterImage,
      projectLinks,
      photo: photoUrl,
      actif: true,
    }).returning();
    
    console.log("[POST /api/admin/candidats-simple] Candidat créé, ID:", result[0].id);
    
    return NextResponse.json({ 
      success: true, 
      id: result[0].id 
    }, { status: 201 });
    
  } catch (err) {
    console.error("[POST /api/admin/candidats-simple] ERREUR:", err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : "Erreur serveur" 
    }, { status: 500 });
  }
}
