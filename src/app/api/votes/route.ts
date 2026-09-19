import { NextRequest, NextResponse } from "next/server";
import { db, votes, candidates } from "@/db";
import { eq } from "drizzle-orm";
// import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary"; // MODE MANUEL DÉSACTIVÉ
// import { sendNewVoteNotification } from "@/lib/email"; // MODE MANUEL DÉSACTIVÉ
import { VOTE_PRICE } from "@/lib/constants";
import { createFedaPayTransaction } from "@/lib/fedapay";

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
    const { candidatId, nomVotant, telephone, nombreVotes } = body;

    if (!candidatId || !nomVotant || !telephone || !nombreVotes) {
      return NextResponse.json(
        { error: "Tous les champs sont requis." },
        { status: 400 }
      );
    }

    if (nombreVotes < 1 || nombreVotes > 100) {
      return NextResponse.json(
        { error: "Le nombre de votes doit être entre 1 et 100." },
        { status: 400 }
      );
    }

    if (!/^0[1-9][0-9]{8}$/.test(telephone.trim())) {
      return NextResponse.json(
        { error: "Format de téléphone invalide." },
        { status: 400 }
      );
    }

    if (!nomVotant.trim()) {
      return NextResponse.json(
        { error: "Le nom du votant est requis." },
        { status: 400 }
      );
    }

    const candidatRes = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidatId));
    const candidat = candidatRes[0];

    if (!candidat || !candidat.actif) {
      return NextResponse.json(
        { error: "Candidat introuvable." },
        { status: 404 }
      );
    }

    const montant = nombreVotes * VOTE_PRICE;

    // Créer le vote en attente
    const result = await db
      .insert(votes)
      .values({
        candidateId: candidatId,
        nomVotant: nomVotant.trim(),
        telephone: telephone.trim(),
        nombreVotes,
        montant,
        statut: "en_attente",
      })
      .returning();

    const vote = result[0];

    // Créer la transaction FedaPay
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const callbackUrl = `${baseUrl}/api/votes/callback/${vote.id}`;

    const fedapay = await createFedaPayTransaction({
      nomVotant: nomVotant.trim(),
      telephone: telephone.trim(),
      nombreVotes,
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

    return NextResponse.json(
      { success: true, voteId: vote.id, paymentUrl: fedapay.paymentUrl },
      { status: 201 }
    );
  } catch (err) {
    console.error("Vote API error:", err);
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
