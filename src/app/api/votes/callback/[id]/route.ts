import { NextRequest, NextResponse } from "next/server";
import { db, votes, candidates } from "@/db";
import { eq } from "drizzle-orm";
import { getFedaPayTransaction } from "@/lib/fedapay";
import { sendVoteValidatedNotification } from "@/lib/email";
import { logError } from "@/lib/log-error";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const voteId = parseInt(id);
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  try {
    const voteRes = await db.select().from(votes).where(eq(votes.id, voteId));
    const vote = voteRes[0];

    if (!vote) {
      return NextResponse.redirect(`${baseUrl}/vote/failed?reason=not_found`);
    }

    // Vérifier le statut de la transaction FedaPay
    if (vote.fedapayTransactionId) {
      const transaction = await getFedaPayTransaction(vote.fedapayTransactionId);
      const status = transaction.status;

      if (status === "approved") {
        await db
          .update(votes)
          .set({
            statut: "valide",
            fedapayStatus: "approved",
            commentaireAdmin: "Paiement validé automatiquement via FedaPay",
          })
          .where(eq(votes.id, voteId));

        // Notification email
        const candidatRes = await db
          .select()
          .from(candidates)
          .where(eq(candidates.id, vote.candidateId));

        if (candidatRes[0]) {
          await sendVoteValidatedNotification({
            nomVotant: vote.nomVotant,
            nombreVotes: vote.nombreVotes,
            montant: vote.montant,
            candidatNom: candidatRes[0].nom,
          });
        }

        return NextResponse.redirect(
          `${baseUrl}/vote/success?voteId=${voteId}`
        );
      } else if (status === "declined") {
        await db
          .update(votes)
          .set({ statut: "refuse", fedapayStatus: "declined" })
          .where(eq(votes.id, voteId));

        return NextResponse.redirect(
          `${baseUrl}/vote/failed?reason=declined`
        );
      } else {
        // Annulé ou autre
        await db
          .update(votes)
          .set({ statut: "refuse", fedapayStatus: status })
          .where(eq(votes.id, voteId));

        return NextResponse.redirect(
          `${baseUrl}/vote/failed?reason=canceled`
        );
      }
    }

    return NextResponse.redirect(`${baseUrl}/vote/failed?reason=unknown`);
  } catch (err) {
    logError("Callback FedaPay", err);
    return NextResponse.redirect(`${baseUrl}/vote/failed?reason=error`);
  }
}
