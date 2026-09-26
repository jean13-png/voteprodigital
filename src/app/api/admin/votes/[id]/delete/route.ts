import { NextRequest, NextResponse } from "next/server";
import { db, votes } from "@/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { logError } from "@/lib/log-error";
import { auditLog } from "@/lib/audit-log";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const voteId = parseInt(id);

    if (!voteId) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Récupérer le vote avant suppression (pour l'audit)
    const voteRes = await db.select().from(votes).where(eq(votes.id, voteId));
    const vote = voteRes[0];

    if (!vote) {
      return NextResponse.json({ error: "Vote non trouvé" }, { status: 404 });
    }

    // Supprimer le vote
    await db.delete(votes).where(eq(votes.id, voteId));

    // Log audit
    await auditLog({
      action: "vote_deleted_temporary",
      userId: session.user.id,
      details: {
        voteId: vote.id,
        nomVotant: vote.nomVotant,
        telephone: vote.telephone,
        candidateId: vote.candidateId,
        statut: vote.statut,
        montant: vote.montant,
        reason: "Suppression temporaire des votes de test",
      },
    });

    return NextResponse.json({ success: true, message: "Vote supprimé" }, { status: 200 });
  } catch (err) {
    logError("DELETE /api/admin/votes/[id]/delete", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
