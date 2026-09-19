import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, votes, candidates } from "@/db";
import { eq } from "drizzle-orm";
import { sendVoteValidatedNotification } from "@/lib/email";
import { auditLog } from "@/lib/audit-log";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const voteId = parseInt(id);

  const existing = await db.select().from(votes).where(eq(votes.id, voteId));
  if (!existing[0]) {
    return NextResponse.json({ error: "Vote introuvable" }, { status: 404 });
  }

  await db
    .update(votes)
    .set({ statut: "valide", commentaireAdmin: "Validé par l'administrateur" })
    .where(eq(votes.id, voteId));

  await auditLog({
    adminId: parseInt(session.user.id),
    action: "validate_vote",
    targetType: "vote",
    targetId: voteId,
  });

  // Notification email
  const candidatRes = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, existing[0].candidateId));

  if (candidatRes[0]) {
    await sendVoteValidatedNotification({
      nomVotant: existing[0].nomVotant,
      nombreVotes: existing[0].nombreVotes,
      montant: existing[0].montant,
      candidatNom: candidatRes[0].nom,
    });
  }

  return NextResponse.json({ success: true });
}
