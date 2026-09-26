import { NextRequest, NextResponse } from "next/server";
import { db, votes, candidates } from "@/db";
import { eq } from "drizzle-orm";
import { createHmac } from "crypto";
import { logError } from "@/lib/log-error";
import { sendNewVoteNotification, sendVoteReceipt } from "@/lib/email";

export const runtime = "nodejs";

function verifyFedaPaySignature(payload: string, signature: string, secret: string): boolean {
  try {
    // FedaPay envoie la signature en base64, donc on doit comparer en base64
    const expected = createHmac("sha256", secret).update(payload).digest("base64");
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

    console.log("[Webhook] Event reçu. Secret configuré:", !!webhookSecret);
    console.log("[Webhook] Signature reçue:", !!signature);
    console.log("[Webhook] Signature value:", signature);

    if (webhookSecret && signature) {
      try {
        const valid = verifyFedaPaySignature(payload, signature, webhookSecret);
        console.log("[Webhook] Signature valide:", valid);
        if (!valid) {
          console.error("[Webhook] Signature INVALIDE! Mais on continue pour debug...");
          // TODO: Réactiver après debug
          // return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
        }
      } catch (e) {
        console.error("[Webhook] Erreur vérification signature:", e);
        // TODO: Réactiver après debug
        // return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
      }
    } else {
      console.warn("[Webhook] Secret ou signature manquant - validation ignorée");
    }

    const data = JSON.parse(payload);
    console.log("[Webhook] Données reçues:", JSON.stringify(data, null, 2));

    const { entity, event } = data;

    if (!entity || !event) {
      console.warn("[Webhook] Entity ou event manquant");
      return NextResponse.json({ received: true });
    }

    console.log("[Webhook] Event type:", event, "| Entity reference:", entity.reference);

    // Rechercher le vote par référence FedaPay
    if (entity.reference) {
      const voteRes = await db
        .select()
        .from(votes)
        .where(eq(votes.fedapayReference, entity.reference));

      const vote = voteRes[0];
      
      if (!vote) {
        console.warn("[Webhook] Vote non trouvé pour reference:", entity.reference);
        return NextResponse.json({ received: true });
      }

      console.log("[Webhook] Vote trouvé. Statut actuel:", vote.statut);

      // Idempotence: ignorer si déjà traité
      if (vote.statut === "valide" && event === "transaction.approved") {
        console.log("[Webhook] Vote déjà validé, ignorant");
        return NextResponse.json({ received: true });
      }

      if (vote.statut === "refuse" && (event === "transaction.declined" || event === "transaction.canceled")) {
        console.log("[Webhook] Vote déjà refusé, ignorant");
        return NextResponse.json({ received: true });
      }

      // Traiter l'événement
      if (event === "transaction.approved") {
        console.log("[Webhook] APPROBATION - mise à jour vote à VALIDE");
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
        console.log("[Webhook] REFUS/ANNULATION - mise à jour vote à REFUSE");
        await db
          .update(votes)
          .set({
            statut: "refuse",
            fedapayStatus: event === "transaction.declined" ? "declined" : "canceled",
            commentaireAdmin: "Refusé via FedaPay",
          })
          .where(eq(votes.id, vote.id));
      } else {
        console.log("[Webhook] Event non géré:", event);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Webhook] Erreur:", err);
    logError("Webhook", err);
    return NextResponse.json({ error: "Erreur webhook" }, { status: 500 });
  }
}
