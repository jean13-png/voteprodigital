import { NextRequest, NextResponse } from "next/server";
import { db, votes } from "@/db";
import { eq } from "drizzle-orm";
import { WebhookSignature } from "fedapay";
import { logError } from "@/lib/log-error";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();

    const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET;
    const signature = req.headers.get("x-fedapay-signature");

    if (webhookSecret && signature) {
      try {
        WebhookSignature.verifyHeader(payload, signature, webhookSecret);
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
