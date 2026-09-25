import { NextRequest, NextResponse } from "next/server";
import { db, formationInscriptions } from "@/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const nom = String(body?.nom ?? "").trim();
    const telephone = String(body?.telephone ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const formation = String(body?.formation ?? "").trim();
    const message = String(body?.message ?? "").trim();

    if (!nom || !telephone || !formation) {
      return NextResponse.json(
        { error: "Nom, téléphone et formation sont obligatoires." },
        { status: 400 }
      );
    }

    await db.insert(formationInscriptions).values({
      nom,
      telephone,
      email: email || null,
      formation,
      message: message || null,
    });

    return NextResponse.json({
      success: true,
      message: "Demande enregistrée avec succès.",
    });
  } catch (error) {
    console.error("[formation inscription] error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l’enregistrement de votre demande." },
      { status: 500 }
    );
  }
}
