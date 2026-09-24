# 📖 Guide d'intégration FedaPay — Leçons apprises

> Document rédigé à partir de l'expérience réelle d'intégration sur **voteprodigital.vercel.app**  
> Date : Septembre 2026

---

## 🎯 Ce que FedaPay fait

FedaPay est une passerelle de paiement Mobile Money (MTN, Moov) pour l'Afrique de l'Ouest.  
Le flux est simple :

```
Ton app → Crée une transaction → FedaPay retourne une payment_url → Redirige l'utilisateur → FedaPay notifie ton webhook
```

---

## 🔑 Clés API

### Types de clés
| Clé | Préfixe | Usage |
|-----|---------|-------|
| Publique | `pk_live_xxx` ou `pk_sandbox_xxx` | Frontend (JS) |
| Secrète | `sk_live_xxx` ou `sk_sandbox_xxx` | Backend uniquement |

### ⚠️ Règles importantes
- **Ne jamais** exposer la clé secrète côté client
- En développement → utiliser `sk_sandbox_xxx`
- En production → utiliser `sk_live_xxx`
- Changer `FEDAPAY_MODE=sandbox` → `FEDAPAY_MODE=live` en prod

### Variables d'environnement
```bash
FEDAPAY_PUBLIC_KEY=pk_live_xxxxx
FEDAPAY_SECRET_KEY=sk_live_xxxxx
FEDAPAY_MODE=live                          # sandbox ou live
FEDAPAY_WEBHOOK_SECRET=ton_secret_fort
```

---

## 📞 Format du numéro de téléphone

### ❌ Ce qui ne marche PAS

```typescript
// ❌ Format E.164 international
phone = "+22901XXXXXXXX"   // Refusé par FedaPay

// ❌ Avec indicatif sans +
phone = "22901XXXXXXXX"    // Refusé

// ❌ Ancien format 8 chiffres sans 0
phone = "XXXXXXXX"         // Valide seulement pour anciens numéros
```

### ✅ Ce qui marche

```typescript
// ✅ Format correct : numéro local AVEC le 0 initial, country: "BJ"
phone_number: {
  number: "0144970593",   // 10 chiffres, commence par 01
  country: "BJ"           // Majuscules obligatoires
}
```

### Contexte historique important
- **Avant novembre 2024** : numéros béninois à 8 chiffres (ex: `97808080`)
- **Depuis le 30 novembre 2024** : numéros à 10 chiffres avec préfixe `01` (ex: `0144970593`)
- La **doc officielle FedaPay** montre encore l'ancien format à 8 chiffres — **ne pas s'y fier**
- Le **SDK Node.js v1.2.5** ne valide pas correctement les nouveaux numéros

### Fonction de conversion
```typescript
function formatPhoneForFedaPay(telephone: string): string {
  let phone = telephone.replace(/\s/g, "").replace(/-/g, "");

  if (phone.startsWith("+229")) {
    phone = "0" + phone.substring(4);
  } else if (phone.startsWith("00229")) {
    phone = "0" + phone.substring(5);
  }
  // Résultat : 0144970593 (10 chiffres avec 0 initial)
  return phone;
}
```

---

## 🚫 SDK Node.js — NE PAS UTILISER

### Pourquoi on a abandonné le SDK

Le SDK FedaPay Node.js (`fedapay` npm package v1.2.5) a plusieurs problèmes :

1. **`FedaPay.setHttpTimeout()` n'existe pas** → erreur au démarrage
2. **Validation du numéro trop stricte** → rejette les nouveaux numéros béninois à 10 chiffres
3. **Pas mis à jour** depuis le changement de numérotation de novembre 2024

```typescript
// ❌ Ne pas faire
import { FedaPay, Transaction } from "fedapay";
FedaPay.setHttpTimeout(30000); // n'existe pas → crash
const transaction = await Transaction.create({ ... }); // rejette 0144970593
```

### ✅ Solution : appel API direct avec fetch

```typescript
// ✅ Faire à la place
const res = await fetch("https://api.fedapay.com/v1/transactions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
    "Content-Type": "application/json",
    "X-Version": "1.1.1",
  },
  body: JSON.stringify({ ... }),
});
```

---

## 📡 Structure de la réponse API

### ⚠️ Piège critique : la clé de réponse

La réponse de FedaPay utilise une clé avec un **slash** : `"v1/transaction"` (pas `v1.transaction` ni `transaction`)

```json
{
  "v1/transaction": {
    "id": 113311925,
    "reference": "trx_V40_xxx",
    "amount": 250,
    "status": "pending",
    "payment_token": "eyJ0eXAi...",
    "payment_url": "https://process.fedapay.com/eyJ0eXAi...",
    ...
  }
}
```

### Extraction correcte

```typescript
// ✅ Correct — noter les guillemets autour de "v1/transaction"
const transaction = txData?.["v1/transaction"];
const transactionId = transaction.id;
const paymentUrl = transaction.payment_url; // Directement disponible !
```

```typescript
// ❌ Incorrect — ne retourne rien
const transaction = txData?.v1?.transaction;  // undefined
const transaction = txData?.transaction;       // undefined
const transaction = txData?.v1;               // undefined
```

---

## 💳 Flux complet de création de transaction

### Ce que la doc dit (simplifié)

```
POST /v1/transactions
→ Reçoit : description, amount, currency, callback_url, customer
→ Retourne : transaction avec payment_url
→ Rediriger l'utilisateur vers payment_url
```

### Implémentation qui marche

```typescript
async function createFedaPayTransaction(params) {
  const FEDAPAY_API_URL = process.env.FEDAPAY_MODE === "live"
    ? "https://api.fedapay.com/v1"
    : "https://sandbox-api.fedapay.com/v1";

  const phone = formatPhoneForFedaPay(params.telephone);

  const res = await fetch(`${FEDAPAY_API_URL}/transactions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
      "Content-Type": "application/json",
      "X-Version": "1.1.1",
    },
    body: JSON.stringify({
      description: `Vote pour ${params.candidatNom}`,
      amount: params.montant,            // Entier, en FCFA
      currency: { iso: "XOF" },         // Franc CFA
      callback_url: params.callbackUrl,  // URL de retour après paiement
      customer: {
        firstname: "Jean",
        lastname: "Dupont",
        phone_number: {
          number: phone,    // ex: "0144970593"
          country: "BJ",    // Majuscules !
        },
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message ?? "Erreur FedaPay");
  }

  // ⚠️ Clé avec slash !
  const transaction = data["v1/transaction"];

  return {
    transactionId: String(transaction.id),
    reference: transaction.reference,
    paymentUrl: transaction.payment_url, // Pas besoin d'un 2e appel pour le token
  };
}
```

---

## 🔔 Webhooks

### Configuration

1. Dans le **Dashboard FedaPay** → Webhooks → Ajouter
2. URL : `https://ton-domaine.com/api/webhook/fedapay`
3. Générer un secret fort :
   ```bash
   openssl rand -base64 32
   ```
4. Mettre ce secret dans `FEDAPAY_WEBHOOK_SECRET`

### Vérification de signature

FedaPay envoie un header `x-fedapay-signature` avec chaque webhook.  
**Ne jamais traiter un webhook sans vérifier la signature.**

```typescript
// ✅ Vérification HMAC SHA-256
function verifyFedaPaySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return expected === signature;
}
```

### ⚠️ Ne pas utiliser `WebhookSignature` du SDK

```typescript
// ❌ Dépend du SDK bugué
import { WebhookSignature } from "fedapay";
WebhookSignature.verifyHeader(payload, signature, secret);

// ✅ Implémenter soi-même avec crypto natif (voir ci-dessus)
```

### Événements à gérer

```typescript
if (event === "transaction.approved") {
  // Paiement réussi → valider le vote
}
if (event === "transaction.declined" || event === "transaction.canceled") {
  // Paiement échoué → refuser le vote
}
```

---

## 🧪 Tests en Sandbox

### URL sandbox
```
https://sandbox-api.fedapay.com/v1
```

### Numéros de test
FedaPay fournit des numéros de test dans leur dashboard sandbox.

### Workflow de test
1. `FEDAPAY_MODE=sandbox`
2. Utiliser `sk_sandbox_xxx`
3. Tester les paiements
4. Vérifier que le webhook reçoit bien les événements
5. Seulement après → passer en `live`

---

## ❓ Erreurs fréquentes et solutions

### `phone_number: n'est pas valide`
**Cause** : Mauvais format de numéro  
**Solution** : Utiliser le format `0XXXXXXXXX` avec `country: "BJ"` (10 chiffres)

### `FedaPay.setHttpTimeout is not a function`
**Cause** : Méthode inexistante dans le SDK v1.2.5  
**Solution** : Supprimer cette ligne. Ou mieux, ne pas utiliser le SDK.

### `Transaction ID manquant`
**Cause** : Mauvaise extraction de la réponse JSON  
**Solution** : Utiliser `data["v1/transaction"]` (avec les crochets et guillemets)

### Timeout de 5 secondes
**Cause** : Le SDK utilise un timeout par défaut de 5s  
**Solution** : Utiliser `fetch` directement, le timeout par défaut de Node est bien plus élevé

### `La création de la transaction a échoué`
**Causes possibles** :
1. Mauvais format de numéro → vérifier avec `console.log`
2. Mauvaise clé API (sandbox vs live)
3. Montant négatif ou non entier
4. `callback_url` inaccessible

---

## 📋 Checklist avant mise en production

- [ ] `FEDAPAY_MODE=live`
- [ ] Clé `sk_live_xxx` (pas sandbox)
- [ ] Webhook configuré dans le dashboard FedaPay
- [ ] `FEDAPAY_WEBHOOK_SECRET` défini
- [ ] URL webhook accessible publiquement
- [ ] Test complet avec un vrai paiement en sandbox avant live
- [ ] Gestion des erreurs côté utilisateur (message clair si échec)

---

## 🔗 Liens utiles

- **Dashboard FedaPay** : https://app.fedapay.com
- **Doc officielle** : https://docs.fedapay.com
- **Doc v1 (transactions)** : https://docs-v1.fedapay.com/paiements/transactions
- **Support** : support@fedapay.com

---

## 💡 Résumé en une phrase

> Bypasser le SDK, appeler l'API directement avec `fetch`, envoyer le numéro avec `0` initial et `country: "BJ"`, extraire la transaction avec `data["v1/transaction"]`, et utiliser `payment_url` directement sans second appel.

---

*Document mis à jour après intégration complète sur voteprodigital — Septembre 2026*
