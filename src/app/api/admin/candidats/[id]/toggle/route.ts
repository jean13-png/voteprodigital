import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db, candidates } from "@/db";
import { eq } from "drizzle-orm";
import { auditLog } from "@/lib/audit-log";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
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

  await auditLog({
    adminId: parseInt(session.user.id),
    action: "toggle_candidate",
    targetType: "candidate",
    targetId: candidatId,
    details: `actif=${!existing[0].actif}`,
  });

  return NextResponse.json({ success: true, actif: !existing[0].actif });
}
