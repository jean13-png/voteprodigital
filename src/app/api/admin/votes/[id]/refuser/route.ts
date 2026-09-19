import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db, votes } from "@/db";
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
  const voteId = parseInt(id);

  await db
    .update(votes)
    .set({ statut: "refuse", commentaireAdmin: "Refusé par l'administrateur" })
    .where(eq(votes.id, voteId));

  await auditLog({
    adminId: parseInt(session.user.id),
    action: "refuse_vote",
    targetType: "vote",
    targetId: voteId,
  });

  return NextResponse.json({ success: true });
}
