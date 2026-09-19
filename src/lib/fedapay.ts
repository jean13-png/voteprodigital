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

  // Convertir téléphone béninois vers format international
  // Ex: 0167000000 -> +22967000000
  let phone = params.telephone.replace(/\s/g, "");
  if (phone.startsWith("0")) {
    phone = "+229" + phone.substring(1);
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
        country: "bj",
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
