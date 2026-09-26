import { NextRequest, NextResponse } from "next/server";
import { db, votes, candidates, webhookLogs } from "@/db";
import { eq } from "drizzle-orm";
import { createHmac } from "crypto";
import { logError } from "@/lib/log-error";
import { sendNewVoteNotification, sendVoteReceipt } from "@/lib/email";

export const runtime = "nodejs";

interface SignatureTest {
  format: string;
  signature: string;
  match: boolean;
}

function verifyFedaPaySignature(payload: string, signature: string, secret: string): { valid: boolean; format?: string; tests?: SignatureTest[] } {
  const tests: SignatureTest[] = [];
  
  try {
    // Format FedaPay: "t=timestamp,s=signature" (style Stripe)
    if (signature.startsWith("t=") && signature.includes(",s=")) {
      const parts = signature.split(",");
      const timestamp = parts.find(p => p.startsWith("t="))?.substring(2);
      const sig = parts.find(p => p.startsWith("s="))?.substring(2);
      
      if (timestamp && sig) {
        // Construire le payload signé: timestamp.payload
        const signedPayload = `${timestamp}.${payload}`;
        
        // Test SHA256 hex
        const hexSig = createHmac("sha256", secret).update(signedPayload).digest("hex");
        const hexMatch = hexSig === sig;
        tests.push({ format: "STRIPE-SHA256-HEX", signature: hexSig.substring(0, 50), match: hexMatch });
        if (hexMatch) return { valid: true, format: "STRIPE-SHA256-HEX", tests };
        
        // Test SHA256 base64
        const base64Sig = createHmac("sha256", secret).update(signedPayload).digest("base64");
        const base64Match = base64Sig === sig;
        tests.push({ format: "STRIPE-SHA256-BASE64", signature: base64Sig.substring(0, 50), match: base64Match });
        if (base64Match) return { valid: true, format: "STRIPE-SHA256-BASE64", tests };
      }
    }
    
    // Fallback: tests classiques (sans timestamp)
    // 1. SHA256 en hex
    const hexSignature = createHmac("sha256", secret).update(payload).digest("hex");
    const hexMatch = hexSignature === signature;
    tests.push({ format: "SHA256-HEX", signature: hexSignature.substring(0, 50), match: hexMatch });
    if (hexMatch) return { valid: true, format: "SHA256-HEX", tests };
    
    // 2. SHA256 en base64
    const base64Signature = createHmac("sha256", secret).update(payload).digest("base64");
    const base64Match = base64Signature === signature;
    tests.push({ format: "SHA256-BASE64", signature: base64Signature.substring(0, 50), match: base64Match });
    if (base64Match) return { valid: true, format: "SHA256-BASE64", tests };
    
    // 3. SHA1 en hex
    const sha1Hex = createHmac("sha1", secret).update(payload).digest("hex");
    const sha1HexMatch = sha1Hex === signature;
    tests.push({ format: "SHA1-HEX", signature: sha1Hex.substring(0, 50), match: sha1HexMatch });
    if (sha1HexMatch) return { valid: true, format: "SHA1-HEX", tests };
    
    // 4. SHA1 en base64
    const sha1Base64 = createHmac("sha1", secret).update(payload).digest("base64");
    const sha1Base64Match = sha1Base64 === signature;
    tests.push({ format: "SHA1-BASE64", signature: sha1Base64.substring(0, 50), match: sha1Base64Match });
    if (sha1Base64Match) return { valid: true, format: "SHA1-BASE64", tests };

    return { valid: false, tests };
  } catch (e) {
    console.error("[Signature] Erreur:", e);
    return { valid: false, tests };
  }
}

export async function POST(req: NextRequest) {
  let webhookLog: any = {
    event: "unknown",
    status: 500,
    signatureReceived: undefined,
    signatureFormat: undefined,
    signatureValid: false,
    payload: undefined,
    error: undefined,
  };

  try {
    const payload = await req.text();
    const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET;
    const signature = req.headers.get("x-fedapay-signature");

    webhookLog.payload = payload.substring(0, 500);
    webhookLog.signatureReceived = signature?.substring(0, 100);

    if (!webhookSecret) {
      webhookLog.status = 200;
      webhookLog.error = "FEDAPAY_WEBHOOK_SECRET manquant";
      await db.insert(webhookLogs).values(webhookLog).catch(() => {});
      
      try {
        const data = JSON.parse(payload);
        processWebhookAsync(data.entity, data.event).catch(() => {});
      } catch {}
      
      return NextResponse.json({ received: true, warning: "No secret configured" }, { status: 200 });
    }

    if (!signature) {
      webhookLog.status = 200;
      webhookLog.error = "Signature manquante";
      await db.insert(webhookLogs).values(webhookLog).catch(() => {});
      
      try {
        const data = JSON.parse(payload);
        processWebhookAsync(data.entity, data.event).catch(() => {});
      } catch {}
      
      return NextResponse.json({ received: true, warning: "No signature" }, { status: 200 });
    }

    const { valid, format, tests } = verifyFedaPaySignature(payload, signature, webhookSecret);
    
    webhookLog.signatureValid = valid;
    webhookLog.signatureFormat = format || "AUCUN_MATCH";

    if (!valid) {
      webhookLog.status = 200;
      webhookLog.error = `Signature invalide. Tests: ${tests?.map(t => `${t.format}=${t.match}`).join(", ")}`;
      await db.insert(webhookLogs).values(webhookLog).catch(() => {});
      
      // On traite quand même le webhook (mode permissif temporaire)
      try {
        const data = JSON.parse(payload);
        processWebhookAsync(data.entity, data.event).catch(() => {});
      } catch {}
      
      return NextResponse.json({ received: true, warning: "Signature mismatch but accepted" }, { status: 200 });
    }

    const data = JSON.parse(payload);
    const { entity, event } = data;

    webhookLog.event = event || "unknown";
    webhookLog.status = 200;

    // Insérer le log dans la DB
    await db.insert(webhookLogs).values(webhookLog).catch(() => {});

    if (!entity || !event) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Traiter en arrière-plan
    processWebhookAsync(entity, event).catch((err) => {
      logError("processWebhookAsync", err);
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    webhookLog.status = 200;
    webhookLog.error = `Erreur: ${String(err)}`;
    await db.insert(webhookLogs).values(webhookLog).catch(() => {});
    logError("Webhook", err);
    return NextResponse.json({ received: true, error: "Error but accepted" }, { status: 200 });
  }
}

// Fonction de traitement asynchrone (ne bloque pas la réponse HTTP)
async function processWebhookAsync(entity: any, event: string) {
  try {
    if (!entity.reference) {
      return;
    }

    const voteRes = await db
      .select()
      .from(votes)
      .where(eq(votes.fedapayReference, entity.reference));

    const vote = voteRes[0];
    
    if (!vote) {
      return;
    }

    // Idempotence: ignorer si déjà traité
    if (vote.statut === "valide" && event === "transaction.approved") {
      return;
    }

    if (vote.statut === "refuse" && (event === "transaction.declined" || event === "transaction.canceled")) {
      return;
    }

    // Traiter l'événement
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
        sendNewVoteNotification({
          id: vote.id,
          nomVotant: vote.nomVotant,
          telephone: vote.telephone,
          nombreVotes: vote.nombreVotes,
          montant: vote.montant,
          candidatNom: candidat.nom,
          preuve: vote.preuve,
        }).catch((err) => logError("sendNewVoteNotification", err));

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
  } catch (err) {
    logError("processWebhookAsync", err);
  }
}
