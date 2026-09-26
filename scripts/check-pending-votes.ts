/**
 * Script pour vérifier et corriger les votes bloqués
 * 
 * Usage: npx tsx scripts/check-pending-votes.ts
 * 
 * Ce script :
 * 1. Liste tous les votes "en_attente" avec un fedapayTransactionId
 * 2. Vérifie leur statut réel sur FedaPay
 * 3. Met à jour automatiquement ceux qui sont "approved" mais pas encore validés
 */

import { db, votes, candidates } from "../src/db";
import { eq } from "drizzle-orm";
import { getFedaPayTransaction } from "../src/lib/fedapay";
import { sendNewVoteNotification, sendVoteReceipt } from "../src/lib/email";

async function checkPendingVotes() {
  console.log("🔍 Recherche des votes en attente...\n");

  // Récupérer tous les votes en_attente avec une transaction FedaPay
  const pendingVotes = await db
    .select()
    .from(votes)
    .where(eq(votes.statut, "en_attente"));

  const votesWithTransaction = pendingVotes.filter(v => v.fedapayTransactionId);

  if (votesWithTransaction.length === 0) {
    console.log("✅ Aucun vote en attente avec transaction FedaPay\n");
    return;
  }

  console.log(`📊 ${votesWithTransaction.length} vote(s) en attente trouvé(s)\n`);

  let updated = 0;
  let errors = 0;

  for (const vote of votesWithTransaction) {
    try {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Vote #${vote.id} - ${vote.nomVotant}`);
      console.log(`Transaction: ${vote.fedapayTransactionId}`);
      console.log(`Reference: ${vote.fedapayReference}`);

      // Vérifier le statut sur FedaPay
      if (!vote.fedapayTransactionId) {
        console.log(`⚠️ Pas de transaction ID - Ignoré`);
        continue;
      }
      
      const transactionData = await getFedaPayTransaction(vote.fedapayTransactionId);
      const transaction = transactionData?.["v1/transaction"] || transactionData;
      const status = transaction?.status;

      console.log(`Statut FedaPay: ${status}`);

      if (status === "approved") {
        console.log(`✅ Paiement approuvé ! Mise à jour du vote...`);

        // Mettre à jour le vote
        await db
          .update(votes)
          .set({
            statut: "valide",
            fedapayStatus: "approved",
            commentaireAdmin: "Validé automatiquement via script de récupération",
          })
          .where(eq(votes.id, vote.id));

        // Envoyer les emails
        const candidatRes = await db
          .select()
          .from(candidates)
          .where(eq(candidates.id, vote.candidateId));

        if (candidatRes[0]) {
          const candidat = candidatRes[0];

          // Email admin
          await sendNewVoteNotification({
            id: vote.id,
            nomVotant: vote.nomVotant,
            telephone: vote.telephone,
            nombreVotes: vote.nombreVotes,
            montant: vote.montant,
            candidatNom: candidat.nom,
            preuve: vote.preuve,
          }).catch((err) => {
            console.error("❌ Erreur envoi email admin:", err.message);
          });

          // Email votant
          if (vote.email) {
            await sendVoteReceipt({
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
            }).catch((err) => {
              console.error("❌ Erreur envoi email votant:", err.message);
            });
          }
        }

        console.log(`✅ Vote #${vote.id} mis à jour avec succès`);
        updated++;
      } else if (status === "declined" || status === "canceled") {
        console.log(`❌ Paiement ${status} - Marquage comme refusé...`);

        await db
          .update(votes)
          .set({
            statut: "refuse",
            fedapayStatus: status,
            commentaireAdmin: `Refusé automatiquement (${status}) via script`,
          })
          .where(eq(votes.id, vote.id));

        console.log(`✅ Vote #${vote.id} marqué comme refusé`);
        updated++;
      } else {
        console.log(`⏳ Paiement en cours (${status}) - Pas de changement`);
      }
    } catch (err: any) {
      console.error(`❌ Erreur pour le vote #${vote.id}:`, err.message);
      errors++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n📊 RÉSUMÉ`);
  console.log(`   Votes vérifiés: ${votesWithTransaction.length}`);
  console.log(`   Votes mis à jour: ${updated}`);
  console.log(`   Erreurs: ${errors}`);
  console.log(`\n✅ Terminé\n`);
}

// Exécuter le script
checkPendingVotes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Erreur fatale:", err);
    process.exit(1);
  });
