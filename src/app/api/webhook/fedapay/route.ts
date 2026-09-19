import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db, votes } from "@/db";
import { eq } from "drizzle-orm";
import { logError } from "@/lib/log-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Vérification HMAC timing-safe
    const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET;
    const signature = req.headers.get("x-fedapay-signature");

    if (webhookSecret && signature) {
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(webhookSecret)
      );
      if (!isValid) {
        return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
      }
    }

    const { entity, event } = body;

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

      if (event === "transaction.approved") {
        await db
          .update(votes)
          .set({
            statut: "valide",
            fedapayStatus: "approved",
            commentaireAdmin: "Validé automatiquement via FedaPay",
          })
          .where(eq(votes.id, vote.id));
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
