import { NextRequest, NextResponse } from "next/server";
import { db, votes, candidates } from "@/db";
import { eq } from "drizzle-orm";
import { createHmac } from "crypto";
import { logError } from "@/lib/log-error";
import { sendNewVoteNotification, sendVoteReceipt } from "@/lib/email";

export const runtime = "nodejs";

function verifyFedaPaySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    return expected === signature;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();

    const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET;
    const signature = req.headers.get("x-fedapay-signature");

    if (webhookSecret && signature) {
      try {
        const valid = verifyFedaPaySignature(payload, signature, webhookSecret);
        if (!valid) {
          return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
        }
      } catch {
        return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: "Configuration webhook incomplète" }, { status: 500 });
    }

    const { entity, event } = JSON.parse(payload);

    if (!entity || !event) {
      return NextResponse.json({ received: true });
    }

    // Rechercher le vote par référence FedaPay
    if (entity.reference) {
      const voteRes = await db
        .select()
        .from(votes)
        .where(eq(votes.fedapayReference, entity.reference));

      const vote = voteRes[0];
      if (!vote) return NextResponse.json({ received: true });

      if (vote.statut === "valide" && event === "transaction.approved") {
        return NextResponse.json({ received: true });
      }

      if (vote.statut === "refuse" && (event === "transaction.declined" || event === "transaction.canceled")) {
        return NextResponse.json({ received: true });
      }

      if (event === "transaction.approved") {
        await db
          .update(votes)
          .set({
            statut: "valide",
            fedapayStatus: "approved",
            commentaireAdmin: "Validé automatiquement via FedaPay",
          })
          .where(eq(votes.id, vote.id));

        // Récupérer le candidat pour les emails
        const candidatRes = await db
          .select()
          .from(candidates)
          .where(eq(candidates.id, vote.candidateId));
        const candidat = candidatRes[0];

        if (candidat) {
          // Notifier l'admin que le paiement est confirmé
          sendNewVoteNotification({
            id: vote.id,
            nomVotant: vote.nomVotant,
            telephone: vote.telephone,
            nombreVotes: vote.nombreVotes,
            montant: vote.montant,
            candidatNom: candidat.nom,
            preuve: vote.preuve,
          }).catch((err) => logError("sendNewVoteNotification", err));

          // Envoyer le récépissé au votant
          if (vote.email) {
            sendVoteReceipt({
              id: vote.id,
              nomVotant: vote.nomVotant,
              telephone: vote.telephone,
              email: vote.email,
              nombreVotes: vote.nombreVotes,
              montant: vote.montant,
              candidatNom: candidat.nom,
              statut: "valide",
              createdAt: vote.createdAt,
              fedapayReference: vote.fedapayReference,
            }).catch((err) => logError("sendVoteReceipt", err));
          }
        }
      } else if (
        event === "transaction.declined" ||
        event === "transaction.canceled"
      ) {
        await db
          .update(votes)
          .set({
            statut: "refuse",
            fedapayStatus: event === "transaction.declined" ? "declined" : "canceled",
            commentaireAdmin: "Refusé via FedaPay",
          })
          .where(eq(votes.id, vote.id));
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logError("Webhook", err);
    return NextResponse.json({ error: "Erreur webhook" }, { status: 500 });
  }
}
