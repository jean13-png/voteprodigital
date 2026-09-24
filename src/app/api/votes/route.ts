import { NextRequest, NextResponse } from "next/server";
import { db, votes, candidates } from "@/db";
import { eq } from "drizzle-orm";
import { logError } from "@/lib/log-error";
import { VOTE_PRICE } from "@/lib/constants";
import { createFedaPayTransaction } from "@/lib/fedapay";
import { buildVoteRequestKey, claimIdempotentRequest } from "@/lib/idempotency";

export async function POST(req: NextRequest) {
  try {
    // MODE MANUEL DÉSACTIVÉ — uniquement paiement FedaPay en ligne
    // const contentType = req.headers.get("content-type") ?? "";
    // const isManual = contentType.includes("multipart/form-data");
    // if (isManual) {
    //   return handleManualVote(req);
    // }

    // Paiement automatique FedaPay (JSON)
    const body = await req.json();
    const { candidatId, nomVotant, telephone, email, nombreVotes } = body;

    if (!candidatId || !nomVotant || !telephone || !nombreVotes) {
      return NextResponse.json(
        { error: "Tous les champs sont requis." },
        { status: 400 }
      );
    }

    if (email !== undefined && email !== null && email !== "") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
        return NextResponse.json(
          { error: "Format d'email invalide." },
          { status: 400 }
        );
      }
    }

    const normalizedCandidatId = Number(candidatId);
    const normalizedNombreVotes = Number(nombreVotes);
    const normalizedTelephone = String(telephone).trim();
    const normalizedNom = String(nomVotant).trim();

    const idempotencyKey = buildVoteRequestKey({
      candidatId: normalizedCandidatId,
      telephone: normalizedTelephone,
      nombreVotes: normalizedNombreVotes,
      nomVotant: normalizedNom,
    });

    if (!claimIdempotentRequest(idempotencyKey, 15000)) {
      return NextResponse.json(
        { error: "Demande déjà en cours. Merci de patienter quelques secondes." },
        { status: 409 }
      );
    }

    if (normalizedNombreVotes < 1 || normalizedNombreVotes > 100) {
      return NextResponse.json(
        { error: "Le nombre de votes doit être entre 1 et 100." },
        { status: 400 }
      );
    }

    if (!/^0[1-9][0-9]{8}$/.test(normalizedTelephone)) {
      return NextResponse.json(
        { error: "Format de téléphone invalide. Ex: 0167000000" },
        { status: 400 }
      );
    }

    if (!normalizedNom) {
      return NextResponse.json(
        { error: "Le nom du votant est requis." },
        { status: 400 }
      );
    }

    const candidatRes = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, normalizedCandidatId));
    const candidat = candidatRes[0];

    if (!candidat || !candidat.actif) {
      return NextResponse.json(
        { error: "Candidat introuvable." },
        { status: 404 }
      );
    }

    const montant = normalizedNombreVotes * VOTE_PRICE;

    const recentVotes = await db
      .select()
      .from(votes)
      .where(eq(votes.telephone, normalizedTelephone));

    const recentDuplicate = recentVotes.some((vote) =>
      vote.candidateId === normalizedCandidatId &&
      vote.nomVotant === normalizedNom &&
      vote.nombreVotes === normalizedNombreVotes &&
      vote.statut === "en_attente" &&
      Date.now() - new Date(vote.createdAt).getTime() < 15000
    );

    if (recentDuplicate) {
      return NextResponse.json(
        { error: "Un vote identique a déjà été initié il y a très peu de temps." },
        { status: 409 }
      );
    }

    const result = await db
      .insert(votes)
      .values({
        candidateId: normalizedCandidatId,
        nomVotant: normalizedNom,
        telephone: normalizedTelephone,
        email: email ? String(email).trim() : null,
        nombreVotes: normalizedNombreVotes,
        montant,
        statut: "en_attente",
      })
      .returning();

    const vote = result[0];

    // Créer la transaction FedaPay
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const callbackUrl = `${baseUrl}/api/votes/callback/${vote.id}`;

    const fedapay = await createFedaPayTransaction({
      nomVotant: normalizedNom,
      telephone: normalizedTelephone,
      nombreVotes: normalizedNombreVotes,
      montant,
      candidatNom: candidat.nom,
      callbackUrl,
    });

    // Mettre à jour le vote avec les infos FedaPay
    await db
      .update(votes)
      .set({
        fedapayTransactionId: fedapay.transactionId,
        fedapayReference: fedapay.reference,
      })
      .where(eq(votes.id, vote.id));

    // ⚠️ Les emails sont envoyés UNIQUEMENT après confirmation du paiement
    // via le webhook FedaPay (/api/webhook/fedapay), pas ici.
    // Raison : l'utilisateur peut annuler ou ne pas payer.

    return NextResponse.json(
      { success: true, voteId: vote.id, paymentUrl: fedapay.paymentUrl },
      { status: 201 }
    );
  } catch (err) {
    logError("Vote API", err);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez." },
      { status: 500 }
    );
  }
}

// ─── MODE MANUEL DÉSACTIVÉ — à réactiver si FedaPay est indisponible ─────────
//
// async function handleManualVote(req: NextRequest) {
//   try {
//     const formData = await req.formData();
//
//     const candidatId = parseInt(formData.get("candidatId") as string);
//     const nomVotant = (formData.get("nomVotant") as string)?.trim();
//     const telephone = (formData.get("telephone") as string)?.trim();
//     const nombreVotes = parseInt(formData.get("nombreVotes") as string);
//     const preuveFile = formData.get("preuve") as File | null;
//
//     if (!nomVotant || !telephone || !nombreVotes || !candidatId) {
//       return NextResponse.json(
//         { error: "Tous les champs obligatoires doivent être remplis." },
//         { status: 400 }
//       );
//     }
//
//     if (nombreVotes < 1 || nombreVotes > 100) {
//       return NextResponse.json(
//         { error: "Le nombre de votes doit être entre 1 et 100." },
//         { status: 400 }
//       );
//     }
//
//     if (!preuveFile) {
//       return NextResponse.json(
//         { error: "La preuve de paiement est requise." },
//         { status: 400 }
//       );
//     }
//
//     const candidatRes = await db.select().from(candidates).where(eq(candidates.id, candidatId));
//     const candidat = candidatRes[0];
//
//     if (!candidat || !candidat.actif) {
//       return NextResponse.json({ error: "Candidat introuvable ou inactif." }, { status: 404 });
//     }
//
//     // Upload preuve Cloudinary
//     let preuveUrl: string | null = null;
//     const bytes = await preuveFile.arrayBuffer();
//     const buffer = Buffer.from(bytes);
//
//     if (isCloudinaryConfigured()) {
//       preuveUrl = await uploadToCloudinary(buffer, "prodigital_preuves", `vote_${Date.now()}`);
//     } else {
//       const base64 = buffer.toString("base64");
//       preuveUrl = `data:${preuveFile.type};base64,${base64}`;
//     }
//
//     const montant = nombreVotes * VOTE_PRICE;
//
//     const result = await db.insert(votes).values({
//       candidateId: candidatId,
//       nomVotant,
//       telephone,
//       nombreVotes,
//       montant,
//       preuve: preuveUrl,
//       statut: "en_attente",
//     }).returning();
//
//     const vote = result[0];
//
//     await sendNewVoteNotification({
//       id: vote.id,
//       nomVotant: vote.nomVotant,
//       telephone: vote.telephone,
//       nombreVotes: vote.nombreVotes,
//       montant: vote.montant,
//       candidatNom: candidat.nom,
//       preuve: preuveUrl,
//     });
//
//     return NextResponse.json({ success: true, voteId: vote.id }, { status: 201 });
//   } catch (err) {
//     console.error("Manual vote error:", err);
//     return NextResponse.json({ error: "Erreur serveur. Réessayez." }, { status: 500 });
//   }
// }
