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
      const transactionData = await getFedaPayTransaction(vote.fedapayTransactionId);
      
      // FedaPay retourne { "v1/transaction": {...} }
      const transaction = transactionData?.["v1/transaction"] || transactionData;
      const status = transaction?.status;

      console.log("[Callback] Vote ID:", voteId, "| FedaPay status:", status, "| Vote status:", vote.statut);

      if (status === "approved") {
        // Si déjà validé, rediriger vers succès
        if (vote.statut === "valide") {
          return NextResponse.redirect(`${baseUrl}/vote/success?voteId=${voteId}`);
        }

        // Valider le vote
        await db
          .update(votes)
          .set({
            statut: "valide",
            fedapayStatus: "approved",
            commentaireAdmin: "Paiement validé automatiquement via callback FedaPay",
          })
          .where(eq(votes.id, voteId));

        // Notification email
        const candidatRes = await db
          .select()
          .from(candidates)
          .where(eq(candidates.id, vote.candidateId));

        if (candidatRes[0]) {
          sendVoteValidatedNotification({
            nomVotant: vote.nomVotant,
            nombreVotes: vote.nombreVotes,
            montant: vote.montant,
            candidatNom: candidatRes[0].nom,
          }).catch((err) => logError("sendVoteValidatedNotification", err));
        }

        return NextResponse.redirect(
          `${baseUrl}/vote/success?voteId=${voteId}`
        );
      } else if (status === "declined") {
        if (vote.statut === "refuse") {
          return NextResponse.redirect(`${baseUrl}/vote/failed?reason=declined`);
        }

        await db
          .update(votes)
          .set({ statut: "refuse", fedapayStatus: "declined" })
          .where(eq(votes.id, voteId));

        return NextResponse.redirect(
          `${baseUrl}/vote/failed?reason=declined`
        );
      } else if (status === "canceled") {
        if (vote.statut === "refuse") {
          return NextResponse.redirect(`${baseUrl}/vote/failed?reason=canceled`);
        }

        await db
          .update(votes)
          .set({ statut: "refuse", fedapayStatus: "canceled" })
          .where(eq(votes.id, voteId));

        return NextResponse.redirect(
          `${baseUrl}/vote/failed?reason=canceled`
        );
      } else {
        // Statuts en attente : pending, started, transferred
        // NE PAS marquer comme refusé, rediriger vers page d'attente
        console.log("[Callback] Paiement en cours (status: " + status + "), redirection vers success avec message d'attente");
        
        return NextResponse.redirect(
          `${baseUrl}/vote/success?voteId=${voteId}&pending=true`
        );
      }
    }

    return NextResponse.redirect(`${baseUrl}/vote/failed?reason=unknown`);
  } catch (err) {
    logError("Callback FedaPay", err);
    return NextResponse.redirect(`${baseUrl}/vote/failed?reason=error`);
  }
}
