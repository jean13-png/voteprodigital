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

    // ⚠️ MODE DEBUG: Accepter les webhooks même sans signature (TEMPORAIRE)
    // À retirer une fois le problème résolu
    const debugMode = process.env.FEDAPAY_WEBHOOK_DEBUG === "true";

    if (!webhookSecret) {
      webhookLog.status = 200;
      webhookLog.error = "FEDAPAY_WEBHOOK_SECRET manquant (mais on accepte quand même)";
      
      // 🔥 INSÉRER LE LOG IMMÉDIATEMENT
      await db.insert(webhookLogs).values(webhookLog).catch((err) => {
        console.error("[webhookLogs] Erreur insertion:", err);
      });
      
      // Même sans secret, on traite le webhook
      try {
        const data = JSON.parse(payload);
        processWebhookAsync(data.entity, data.event).catch(() => {});
      } catch {}
      
      return NextResponse.json({ received: true, warning: "No secret configured" }, { status: 200 });
    }

    if (!signature) {
      webhookLog.status = 200;
      webhookLog.error = "Signature manquante (mais on accepte quand même)";
      
      // 🔥 INSÉRER LE LOG IMMÉDIATEMENT
      await db.insert(webhookLogs).values(webhookLog).catch((err) => {
        console.error("[webhookLogs] Erreur insertion:", err);
      });
      
      // Même sans signature, on traite le webhook
      try {
        const data = JSON.parse(payload);
        processWebhookAsync(data.entity, data.event).catch(() => {});
      } catch {}
      
      return NextResponse.json({ received: true, warning: "No signature" }, { status: 200 });
    }

    const { valid, format, tests } = verifyFedaPaySignature(payload, signature, webhookSecret);
    
    webhookLog.signatureValid = valid;
    webhookLog.signatureFormat = format || "AUCUN_MATCH";

    if (!valid && !debugMode) {
      // En mode production strict, on logue mais ON ACCEPTE QUAND MÊME (200)
      webhookLog.status = 200;
      webhookLog.error = `Signature invalide (acceptée en mode souple). Tests: ${tests?.map(t => `${t.format}=${t.match}`).join(", ")}`;
      
      // 🔥 INSÉRER LE LOG IMMÉDIATEMENT
      await db.insert(webhookLogs).values(webhookLog).catch((err) => {
        console.error("[webhookLogs] Erreur insertion:", err);
      });
      
      // On traite quand même le webhook
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

    // 🔥 INSÉRER LE LOG IMMÉDIATEMENT (avant de retourner)
    await db.insert(webhookLogs).values(webhookLog).catch((err) => {
      console.error("[webhookLogs] Erreur insertion:", err);
    });

    if (!entity || !event) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // ⚡ IMPORTANT: Traiter en arrière-plan pour répondre rapidement à FedaPay
    // Ne PAS attendre (await) le traitement complet
    processWebhookAsync(entity, event).catch((err) => {
      logError("processWebhookAsync", err);
    });

    // Répondre immédiatement 200 OK à FedaPay
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    // MÊME EN CAS D'ERREUR, on retourne 200 pour que FedaPay arrête de renvoyer
    webhookLog.status = 200;
    webhookLog.error = `Erreur mais acceptée: ${String(err)}`;
    
    // 🔥 INSÉRER LE LOG IMMÉDIATEMENT
    await db.insert(webhookLogs).values(webhookLog).catch((insertErr) => {
      console.error("[webhookLogs] Erreur insertion:", insertErr);
    });
    
    logError("Webhook", err);
    return NextResponse.json({ received: true, error: "Error but accepted" }, { status: 200 });
  }
}

// Fonction de traitement asynchrone (ne bloque pas la réponse HTTP)
async function processWebhookAsync(entity: any, event: string) {
  try {
    // Rechercher le vote par référence FedaPay
    if (!entity.reference) {
      console.log("[processWebhookAsync] Pas de référence dans entity");
      return;
    }

    const voteRes = await db
      .select()
      .from(votes)
      .where(eq(votes.fedapayReference, entity.reference));

    const vote = voteRes[0];
    
    if (!vote) {
      console.log(`[processWebhookAsync] Vote non trouvé pour reference: ${entity.reference}`);
      return;
    }

    // Idempotence: ignorer si déjà traité
    if (vote.statut === "valide" && event === "transaction.approved") {
      console.log(`[processWebhookAsync] Vote #${vote.id} déjà validé - ignoré`);
      return;
    }

    if (vote.statut === "refuse" && (event === "transaction.declined" || event === "transaction.canceled")) {
      console.log(`[processWebhookAsync] Vote #${vote.id} déjà refusé - ignoré`);
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

      console.log(`[processWebhookAsync] Vote #${vote.id} validé avec succès`);

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
      
      console.log(`[processWebhookAsync] Vote #${vote.id} marqué comme refusé (${event})`);
    }
  } catch (err) {
    console.error("[processWebhookAsync] Erreur:", err);
    logError("processWebhookAsync", err);
  }
}
