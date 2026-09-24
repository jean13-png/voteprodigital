import { FedaPay, Transaction } from "fedapay";

export function initFedaPay() {
  FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY!);
  FedaPay.setEnvironment(process.env.FEDAPAY_MODE === "live" ? "live" : "sandbox");
}

export interface CreateTransactionParams {
  nomVotant: string;
  telephone: string;
  nombreVotes: number;
  montant: number;
  candidatNom: string;
  callbackUrl: string;
}

export async function createFedaPayTransaction(params: CreateTransactionParams) {
  initFedaPay();

  // Séparer prénom / nom
  const parts = params.nomVotant.trim().split(" ");
  const firstname = parts[0] ?? params.nomVotant;
  const lastname = parts.slice(1).join(" ") || "-";

  // Format FedaPay : numéro LOCAL sans le 0 initial ni l'indicatif +229
  // Doc officielle : number: '97808080', country: 'BJ'
  // Anciens numéros (8 chiffres) : 097808080 → 97808080
  // Nouveaux numéros (10 chiffres depuis 2023) : 0167000000 → 167000000
  let phone = params.telephone.replace(/\s/g, "").replace(/-/g, "");
  // Supprimer indicatif si présent
  if (phone.startsWith("+22901") || phone.startsWith("+229")) {
    phone = phone.replace(/^\+229/, "");
  } else if (phone.startsWith("00229")) {
    phone = phone.replace(/^00229/, "");
  } else if (phone.startsWith("0")) {
    // Supprimer le 0 initial : 0167000000 → 167000000
    phone = phone.substring(1);
  }

  const transaction = await Transaction.create({
    description: `Vote pour ${params.candidatNom} - ${params.nombreVotes} vote(s)`,
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
  });

  const token = await transaction.generateToken();

  return {
    transactionId: String(transaction.id),
    reference: transaction.reference as string,
    paymentUrl: token.url as string,
  };
}

export async function getFedaPayTransaction(transactionId: string) {
  initFedaPay();
  const transaction = await Transaction.retrieve(parseInt(transactionId));
  return transaction;
}
