import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, candidates } from "@/db";
import { eq } from "drizzle-orm";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const candidatId = parseInt(id);

  const existing = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, candidatId));

  if (!existing[0]) {
    return NextResponse.json({ error: "Candidat introuvable" }, { status: 404 });
  }

  await db
    .update(candidates)
    .set({ actif: !existing[0].actif, updatedAt: new Date() })
    .where(eq(candidates.id, candidatId));

  return NextResponse.json({ success: true, actif: !existing[0].actif });
}
