/**
 * Intégration FedaPay via appel API direct (fetch)
 * On bypass le SDK Node.js qui ne supporte pas encore
 * les nouveaux numéros béninois à 10 chiffres (depuis nov 2024)
 */

const FEDAPAY_API_URL =
  process.env.FEDAPAY_MODE === "live"
    ? "https://api.fedapay.com/v1"
    : "https://sandbox-api.fedapay.com/v1";

export interface CreateTransactionParams {
  nomVotant: string;
  telephone: string;
  nombreVotes: number;
  montant: number;
  candidatNom: string;
  callbackUrl: string;
}

/**
 * Convertit un numéro béninois vers le format FedaPay
 * FedaPay attend le numéro SANS l'indicatif +229 mais AVEC le préfixe 01
 * Ex: 0144970593 → 0144970593 (garder tel quel, 10 chiffres)
 * Ex: +22944970593 → 0144970593
 */
function formatPhoneForFedaPay(telephone: string): string {
  let phone = telephone.replace(/\s/g, "").replace(/-/g, "");

  // Supprimer indicatif +229 ou 00229
  if (phone.startsWith("+229")) {
    phone = "0" + phone.substring(4); // +22944970593 → 044970593 → on ajoute 01
  } else if (phone.startsWith("00229")) {
    phone = "0" + phone.substring(5);
  }

  // À ce stade, phone doit commencer par 0 et avoir 10 chiffres
  // Ex: 0144970593
  return phone;
}

export async function createFedaPayTransaction(params: CreateTransactionParams) {
  const apiKey = process.env.FEDAPAY_SECRET_KEY!;

  // Séparer prénom / nom
  const parts = params.nomVotant.trim().split(" ");
  const firstname = parts[0] ?? params.nomVotant;
  const lastname = parts.slice(1).join(" ") || "-";

  const phone = formatPhoneForFedaPay(params.telephone);

  console.log("[FedaPay] Téléphone brut:", params.telephone, "→ envoyé:", phone);
  console.log("[FedaPay] Mode:", process.env.FEDAPAY_MODE, "| URL:", FEDAPAY_API_URL);

  // 1. Créer la transaction
  const txRes = await fetch(`${FEDAPAY_API_URL}/transactions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Version": "1.1.1",
    },
    body: JSON.stringify({
      description: `Vote pour ${params.candidatNom} — ${params.nombreVotes} vote(s)`,
      amount: params.montant,
      currency: { iso: "XOF" },
      callback_url: params.callbackUrl,
      customer: {
        firstname,
        lastname,
        phone_number: {
          number: phone,
          country: "BJ",
        },
      },
    }),
  });

  const txData = await txRes.json();

  if (!txRes.ok) {
    throw {
      errorMessage: txData?.message ?? "Erreur FedaPay",
      errors: txData?.errors ?? {},
    };
  }

  // La clé de réponse FedaPay est "v1/transaction" (avec slash)
  const transaction = txData?.["v1/transaction"];

  if (!transaction?.id) {
    throw new Error(`Transaction ID manquant. Réponse: ${JSON.stringify(txData)}`);
  }

  // payment_url et payment_token sont directement dans la réponse — pas besoin d'un 2e appel
  const paymentUrl = transaction.payment_url;

  if (!paymentUrl) {
    throw new Error("payment_url manquant dans la réponse FedaPay");
  }

  return {
    transactionId: String(transaction.id),
    reference: transaction.reference as string,
    paymentUrl,
  };
}

export async function getFedaPayTransaction(transactionId: string) {
  const apiKey = process.env.FEDAPAY_SECRET_KEY!;

  const res = await fetch(`${FEDAPAY_API_URL}/transactions/${transactionId}`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "X-Version": "1.1.1",
    },
  });

  return res.json();
}
