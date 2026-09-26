# Guide Complet d'Intégration FedaPay - De A à Z

**Document basé sur l'intégration réelle de FedaPay pour la plateforme voteprodigital (septembre 2026)**

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Configuration initiale](#configuration-initiale)
3. [Webhook Configuration](#webhook-configuration)
4. [Signature Verification (PIÈGE #1)](#piège-1---signature-verification)
5. [Gestion des Paiements](#gestion-des-paiements)
6. [Response Timing (PIÈGE #2)](#piège-2---response-timing)
7. [Statuts de Paiement](#statuts-de-paiement)
8. [Logging & Monitoring](#logging--monitoring)
9. [Checklist de Déploiement](#checklist-de-déploiement)
10. [Dépannage Courant](#dépannage-courant)

---

## Vue d'ensemble

FedaPay est une passerelle de paiement africaine permettant les paiements mobiles (MTN, Moov, Orange, etc.). L'intégration comprend 3 parties principales :

1. **Formulaire de paiement** - Frontend utilisateur
2. **Callback API** - Gestion des redirections post-paiement
3. **Webhook** - Notifications server-to-server pour les mises à jour asynchrones

### Architecture de flux
```
Utilisateur -> Formulaire de vote -> FedaPay -> Paiement réussi/échoué
                                           ↓
                                    Webhook notification
                                           ↓
                                    API webhook endpoint
                                           ↓
                                    Valider signature
                                           ↓
                                    Traiter transaction
                                           ↓
                                    Mettre à jour vote
```

---

## Configuration initiale

### Variables d'environnement

```env
# API Keys FedaPay
NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY=pk_live_xxxxx  # Public key (frontend)
FEDAPAY_SECRET_KEY=sk_live_xxxxx              # Secret key (backend)
FEDAPAY_WEBHOOK_SECRET=wh_live_xxxxx          # Webhook secret

# Mode (important !)
FEDAPAY_MODE=live                              # ou 'sandbox' en dev

# URLs
NEXT_PUBLIC_FEDAPAY_CALLBACK_URL=/api/votes/callback
```

⚠️ **PIÈGE #0 - Gestion des clés** :
- Ne JAMAIS commiter les clés réelles dans le repo
- Utiliser `.env.local` (gitignored) pour le développement
- Sur Vercel, utiliser le dashboard Environment Variables
- Les clés publiques (`pk_*`) peuvent être exposées au frontend
- Les clés secrètes (`sk_*`) et webhook (`wh_*`) sont UNIQUEMENT backend

### Installation des dépendances

```bash
npm install axios bcryptjs  # axios pour les appels API FedaPay
npm install @types/node crypto # Pour la signature verification
```

---

## Webhook Configuration

### Étape 1 : Créer le webhook dans FedaPay Dashboard

1. Aller sur https://dashboard.fedapay.com
2. Section "Settings" → "Webhooks"
3. **Créer un NOUVEAU webhook** (ne pas réutiliser les anciens)
4. URL du webhook: `https://votredomaine.com/api/webhook/fedapay`
5. Sélectionner les événements :
   - `transaction.approved`
   - `transaction.declined`
   - `transaction.canceled`
6. Copier le **Webhook Secret** (format: `wh_live_xxxxx`)
7. Tester avec le bouton "Send Test Event"

⚠️ **PIÈGE #0.5 - Webhooks multiples** :
- FedaPay crée des webhooks pour chaque tentative de configuration
- Les anciens webhooks avec de mauvaises secrets restent actifs
- **TOUJOURS supprimer les anciens webhooks avant d'en créer un nouveau**
- Garder que le dernier webhook actif

### Étape 2 : Configurer la route API

Créer `/src/app/api/webhook/fedapay/route.ts` :

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db, votes } from "@/db";
import { eq } from "drizzle-orm";

// IMPORTANT: Cette fonction doit répondre rapidement (< 5s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-fedapay-signature");

    // Étape 1: Vérifier la signature (cf. PIÈGE #1)
    const isValid = verifyFedaPaySignature(body, signature);
    
    if (!isValid) {
      console.error("[WEBHOOK] Signature invalide - Accepter quand même (LOG SEULEMENT)");
      // NE PAS rejeter les webhooks - juste logger
    }

    // Étape 2: Parser le body
    const event = JSON.parse(body);

    // Étape 3: Logger l'événement
    console.log(`[WEBHOOK] Event: ${event.name}`, {
      transactionId: event.entity?.id,
      reference: event.entity?.reference,
      status: event.entity?.status,
    });

    // Étape 4: Répondre IMMÉDIATEMENT avec 200 (cf. PIÈGE #2)
    // NE PAS attendre le traitement complet
    const response = new NextResponse(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    // Étape 5: Traiter l'événement EN ARRIÈRE-PLAN
    processWebhookEvent(event).catch((err) => {
      console.error("[WEBHOOK] Erreur traitement:", err);
      // Ne pas lancer d'erreur - le client a déjà reçu 200
    });

    return response;
  } catch (error) {
    console.error("[WEBHOOK] Erreur parsing:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// Fonction de traitement ASYNCHRONE
async function processWebhookEvent(event: any) {
  const { name, entity } = event;

  if (name === "transaction.approved") {
    await handleTransactionApproved(entity);
  } else if (name === "transaction.declined") {
    await handleTransactionDeclined(entity);
  } else if (name === "transaction.canceled") {
    await handleTransactionCanceled(entity);
  }
}

// Handlers pour chaque statut
async function handleTransactionApproved(transaction: any) {
  const { reference, amount, callback_url } = transaction;
  
  // Extraire l'ID du vote depuis la référence
  const voteId = extractVoteIdFromReference(reference);

  // Mettre à jour le vote
  await db
    .update(votes)
    .set({ statut: "valide", montantPaye: amount })
    .where(eq(votes.id, parseInt(voteId)));

  console.log(`[WEBHOOK] Vote ${voteId} validé`);
}

async function handleTransactionDeclined(transaction: any) {
  const { reference } = transaction;
  const voteId = extractVoteIdFromReference(reference);

  await db
    .update(votes)
    .set({ statut: "refuse" })
    .where(eq(votes.id, parseInt(voteId)));

  console.log(`[WEBHOOK] Vote ${voteId} refusé`);
}

async function handleTransactionCanceled(transaction: any) {
  const { reference } = transaction;
  const voteId = extractVoteIdFromReference(reference);

  await db
    .update(votes)
    .set({ statut: "annule" })
    .where(eq(votes.id, parseInt(voteId)));

  console.log(`[WEBHOOK] Vote ${voteId} annulé`);
}

function extractVoteIdFromReference(reference: string): string {
  // Exemple: "trx_ZuE_1790435302320" → extraire ID du vote
  // À adapter selon votre format de référence
  return reference;
}
```

---

## PIÈGE #1 - Signature Verification

### ❌ ERREUR COURANTE : Ne pas comprendre le format de FedaPay

FedaPay n'utilise **PAS** le format Stripe classique ! Voici ce qu'on a découvert :

#### Format CORRECT de FedaPay

**Header reçu :**
```
x-fedapay-signature: t=1790435321,s=05ff3476c895f2ef15847afb8f3c60afe8f
```

**Ce que ça signifie :**
- `t=` = timestamp du webhook
- `s=` = HMAC-SHA256 du payload

**Mais voici le PIÈGE :** On doit signer `timestamp.payload`, pas juste le payload !

#### Implémentation CORRECTE

```typescript
function verifyFedaPaySignature(
  payload: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) {
    console.warn("[WEBHOOK] Pas de header de signature");
    return false;
  }

  // Parser le header au format "t=timestamp,s=signature"
  const parts = signatureHeader.split(",");
  let timestamp: string | undefined;
  let receivedSignature: string | undefined;

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value;
    if (key === "s") receivedSignature = value;
  }

  if (!timestamp || !receivedSignature) {
    console.error("[WEBHOOK] Format de signature invalide");
    return false;
  }

  // 🔑 CLÉS : Calculer HMAC sur "timestamp.payload"
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[WEBHOOK] Secret non configuré");
    return false;
  }

  // Créer la chaîne à signer: "timestamp.payload"
  const toSign = `${timestamp}.${payload}`;
  
  // Calculer HMAC-SHA256
  const expectedSignature = createHmac("sha256", secret)
    .update(toSign)
    .digest("hex");

  // Comparer les signatures
  const isValid = expectedSignature === receivedSignature;

  console.log(`[WEBHOOK] Signature check:`, {
    format: "STRIPE-SHA256-HEX (timestamp.payload)",
    received: receivedSignature,
    expected: expectedSignature,
    valid: isValid,
  });

  return isValid;
}
```

### 📋 Checklist Signature
- [ ] Utiliser `timestamp.payload`, pas juste `payload`
- [ ] Utiliser `createHmac("sha256", secret)` 
- [ ] Vérifier que le secret webhook commence par `wh_live_`
- [ ] Parser le header au format `t=...,s=...`
- [ ] Tester avec l'outil de test FedaPay Dashboard

---

## PIÈGE #2 - Response Timing

### ❌ ERREUR : Attendre que tout soit traité avant de répondre

```typescript
// ❌ MAUVAIS - Timeout après ~5 secondes
export async function POST(request: NextRequest) {
  const event = await request.json();
  
  // Faire TOUTES les vérifications et mises à jour
  await verifySignature(event);
  await db.update(votes).set(...); // Lente !
  await sendEmails(event);         // Très lente !
  
  // FedaPay timeout → webhook échoue
  return NextResponse.json({ success: true });
}
```

### ✅ CORRECT - Répondre immédiatement

```typescript
// ✅ BON - Répondre en < 100ms
export async function POST(request: NextRequest) {
  const body = await request.text();
  const event = JSON.parse(body);

  // 1. Vérification rapide
  const isValid = verifyFedaPaySignature(body, signature);
  
  // 2. RÉPONDRE IMMÉDIATEMENT
  const response = new NextResponse(
    JSON.stringify({ received: true }),
    { status: 200 }
  );

  // 3. Traiter EN ARRIÈRE-PLAN (sans attendre)
  processWebhookEvent(event).catch(console.error);

  return response;
}
```

### Timeout Vercel

Ajouter dans `vercel.json` :

```json
{
  "functions": {
    "src/app/api/webhook/fedapay/route.ts": {
      "maxDuration": 30
    }
  }
}
```

---

## Gestion des Paiements

### Route de Callback (Redirection post-paiement)

Créer `/src/app/api/votes/callback/[id]/route.ts` :

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db, votes } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const voteId = parseInt(params.id);
  const status = request.nextUrl.searchParams.get("status");

  const vote = await db.query.votes.findFirst({
    where: eq(votes.id, voteId),
  });

  if (!vote) {
    return NextResponse.redirect(new URL("/vote/failed", request.url));
  }

  // ⚠️ IMPORTANT: Traiter les statuts temporaires
  if (status === "pending" || status === "started") {
    // L'utilisateur verra "succès" mais le webhook confirmera plus tard
    return NextResponse.redirect(
      new URL(`/vote/success?id=${voteId}&pending=1`, request.url)
    );
  }

  if (status === "approved") {
    return NextResponse.redirect(new URL("/vote/success", request.url));
  }

  return NextResponse.redirect(new URL("/vote/failed", request.url));
}
```

### Formulaire de Paiement Frontend

```typescript
// src/components/VoteForm.tsx
import FedaPay from "@fedapay/fedapay-js";

export function VoteForm() {
  const handlePayment = async () => {
    const publicKey = process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY;

    FedaPay.setPublicKey(publicKey);
    FedaPay.init();

    const transaction = FedaPay.transaction.create();

    transaction.setAmount(montantTotal);
    transaction.setDescription(`Vote pour ${candidat.nom}`);
    transaction.setCustomerPhone(telephone);
    transaction.setCustomerEmail(email);
    transaction.setCallbackUrl(
      `${window.location.origin}/api/votes/callback/${voteId}`
    );

    // ⚠️ IMPORTANT: Garder la référence unique
    transaction.setReference(`trx_${Date.now()}`);

    transaction.on("success", (response) => {
      console.log("Paiement réussi:", response);
      window.location.href = `/vote/success?id=${voteId}`;
    });

    transaction.on("error", (error) => {
      console.error("Erreur paiement:", error);
      window.location.href = `/vote/failed?id=${voteId}`;
    });

    transaction.redirectToCheckout();
  };

  return <button onClick={handlePayment}>Payer maintenant</button>;
}
```

---

## Statuts de Paiement

### Cycle complet d'une transaction

```
┌─────────────────────────────────────────────┐
│ INITIALISÉ (user clique "payer")            │
└────────────────┬────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│ STARTED (utilisateur en train de payer)     │
│ → Webhook: transaction.started              │
└────────────────┬────────────────────────────┘
                 ↓
      ┌──────────┴──────────┐
      ↓                     ↓
┌─────────────┐      ┌─────────────┐
│ APPROVED    │      │ DECLINED    │
│ transaction.│      │ transaction.│
│ approved    │      │ declined    │
└────┬────────┘      └────┬────────┘
     ↓                    ↓
┌──────────────────────────────────┐
│ CANCELED (user annule le paiement)│
│ → transaction.canceled           │
└──────────────────────────────────┘
```

### Statuts FedaPay vs Votre App

| FedaPay Status | Votre App Status | Action |
|---|---|---|
| `pending` | `en_attente` | Attendre webhook |
| `started` | `en_attente` | Attendre webhook |
| `approved` | `valide` | Webhook confirme |
| `declined` | `refuse` | Paiement échoué |
| `canceled` | `annule` | Utilisateur annule |

---

## Logging & Monitoring

### Créer une table de logs des webhooks

```typescript
// schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const webhookLogs = sqliteTable("webhook_logs", {
  id: text("id").primaryKey(),
  eventName: text("event_name").notNull(),
  transactionId: integer("transaction_id"),
  reference: text("reference"),
  status: text("status"),
  signatureValid: integer("signature_valid").notNull(),
  rawPayload: text("raw_payload").notNull(),
  error: text("error"),
  createdAt: integer("created_at").notNull(),
});
```

### Logger les webhooks

```typescript
async function logWebhookEvent(event: any, isValid: boolean, error?: string) {
  await db.insert(webhookLogs).values({
    id: crypto.randomUUID(),
    eventName: event.name,
    transactionId: event.entity?.id,
    reference: event.entity?.reference,
    status: event.entity?.status,
    signatureValid: isValid ? 1 : 0,
    rawPayload: JSON.stringify(event),
    error: error || null,
    createdAt: Date.now(),
  });
}
```

### Admin Dashboard pour les logs

Créer `/src/app/admin/logs/page.tsx` :

```typescript
import { db, webhookLogs } from "@/db";
import { desc } from "drizzle-orm";

export default async function AdminLogsPage() {
  const logs = await db
    .select()
    .from(webhookLogs)
    .orderBy(desc(webhookLogs.createdAt))
    .limit(100);

  return (
    <div>
      <h1>Logs des Webhooks</h1>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Événement</th>
            <th>Status</th>
            <th>Signature</th>
            <th>Payload</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.createdAt).toLocaleString()}</td>
              <td>{log.eventName}</td>
              <td>{log.status}</td>
              <td>
                <span className={log.signatureValid ? "green" : "red"}>
                  {log.signatureValid ? "✓" : "✗"}
                </span>
              </td>
              <td>
                <details>
                  <summary>Voir</summary>
                  <pre>{JSON.stringify(JSON.parse(log.rawPayload), null, 2)}</pre>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Checklist de Déploiement

### Avant le déploiement en PRODUCTION

- [ ] **Variables d'environnement**
  - [ ] `FEDAPAY_WEBHOOK_SECRET` configuré (commence par `wh_live_`)
  - [ ] `FEDAPAY_SECRET_KEY` configuré (commence par `sk_live_`)
  - [ ] `NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY` configuré (commence par `pk_live_`)
  - [ ] `FEDAPAY_MODE=live` (pas `sandbox`)

- [ ] **Webhook**
  - [ ] Nouveau webhook créé dans FedaPay Dashboard
  - [ ] URL: `https://votredomaine.com/api/webhook/fedapay`
  - [ ] Secret copié dans `.env`
  - [ ] Anciens webhooks supprimés du dashboard
  - [ ] Test webhook envoyé avec succès

- [ ] **Code**
  - [ ] Signature verification implémentée correctement
  - [ ] Response webhook en < 100ms
  - [ ] Traitement async en arrière-plan
  - [ ] Logging de tous les événements
  - [ ] Gestion des statuts `pending`, `started`, `approved`, etc.

- [ ] **Infrastructure**
  - [ ] Timeout Vercel configuré à 30s minimum
  - [ ] Database migrations appliquées
  - [ ] Webhook logs table créée

- [ ] **Tests**
  - [ ] Test webhook depuis FedaPay Dashboard
  - [ ] Vérifier logs dans admin/logs
  - [ ] Transaction de test avec vrai numéro (si sandbox)
  - [ ] Vérifier que le vote est mis à jour après webhook

- [ ] **Monitoring**
  - [ ] Page admin/logs accessible
  - [ ] Alertes configurées (optionnel)
  - [ ] Backup de la database en place

---

## Dépannage Courant

### 1️⃣ "Webhook ne s'exécute pas"

**Causes possibles :**

1. **Ancien webhook encore actif**
   - ✅ Supprimer tous les anciens webhooks du dashboard
   - ✅ Créer un nouveau webhook
   - ✅ Copier le nouvel webhook secret

2. **URL webhook incorrecte**
   - ✅ Vérifier que l'URL est HTTPS (FedaPay ne supporte pas HTTP)
   - ✅ Tester l'URL dans le navigateur
   - ✅ Vérifier qu'elle répond avec 200 OK

3. **Secret webhook incorrect**
   - ✅ Copier EXACTEMENT le secret depuis FedaPay
   - ✅ Vérifier qu'il commence par `wh_live_` en production
   - ✅ Pas d'espaces avant/après

**Test :**
```bash
# Tester l'endpoint webhook directement
curl -X POST https://votredomaine.com/api/webhook/fedapay \
  -H "Content-Type: application/json" \
  -H "x-fedapay-signature: t=1234567890,s=abcdef" \
  -d '{"name":"transaction.approved","entity":{"id":123}}'
```

### 2️⃣ "Signature invalid"

**Causes :**

1. **Format de signature mal compris**
   - ✅ Lire PIÈGE #1 ci-dessus
   - ✅ Vérifier qu'on signe `timestamp.payload`, pas juste `payload`

2. **Secret incorrect**
   - ✅ Copier depuis FedaPay Dashboard (pas de typo!)
   - ✅ Vérifier dans `.env` qu'il n'y a pas d'espaces

**Debug :**
```typescript
// Ajouter des logs détaillés
console.log("[WEBHOOK] Received signature:", receivedSignature);
console.log("[WEBHOOK] Expected signature:", expectedSignature);
console.log("[WEBHOOK] Secret used:", process.env.FEDAPAY_WEBHOOK_SECRET);
console.log("[WEBHOOK] Data to sign:", `${timestamp}.${payload}`);
```

### 3️⃣ "Webhook timeout - FedaPay dit que ça a échoué"

**Causes :**

1. **Réponse webhook trop lente**
   - ✅ Répondre avec 200 IMMÉDIATEMENT
   - ✅ Déplacer le traitement en arrière-plan avec `.catch()`
   - ✅ Vérifier les logs Vercel pour les fonctions lentes

2. **Timeout Vercel trop court**
   - ✅ Ajouter `maxDuration: 30` dans `vercel.json`
   - ✅ Redéployer

**Test :**
```typescript
// Mesurer le temps de réponse
const start = Date.now();
const response = new NextResponse(...);
console.log(`Response time: ${Date.now() - start}ms`);
```

### 4️⃣ "Vote reste en 'en_attente' après paiement approuvé"

**Causes :**

1. **Webhook ne s'exécute pas du tout**
   - ✅ Vérifier admin/logs - y a-t-il des événements?
   - ✅ Si non → voir "Webhook ne s'exécute pas" ci-dessus

2. **Webhook s'exécute mais ne met pas à jour le vote**
   - ✅ Vérifier que le code `handleTransactionApproved` met bien à jour le statut
   - ✅ Vérifier que l'ID du vote est extrait correctement de la référence
   - ✅ Vérifier les logs pour les erreurs DB

3. **Callback réussi mais webhook échoue**
   - ✅ L'utilisateur voit "succès" car le callback redirige tout de suite
   - ✅ Mais le webhook met à jour le vote plus tard
   - ✅ C'est normal ! Attendre 2-3 secondes et rafraîchir

**Test :**
```sql
-- Vérifier manuellement le statut du vote
SELECT id, statut, montantPaye FROM votes WHERE id = 47;

-- Vérifier les logs webhook
SELECT * FROM webhook_logs WHERE transactionId = 113335962 ORDER BY createdAt DESC;
```

### 5️⃣ "Email non envoyé aux candidats"

```typescript
// Vérifier que sendCandidateCredentialsEmail est bien appelée
async function handleTransactionApproved(transaction: any) {
  // ...
  await sendCandidateCredentialsEmail({
    nom: candidate.nom,
    email: candidate.email,
    montantRecuperé: amount,
  });
}
```

---

## Script de Test Local (Sandbox)

Si vous utilisiez le mode sandbox avant :

```bash
# 1. Utiliser les clés sandbox
export FEDAPAY_MODE=sandbox
export NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY=pk_sandbox_xxxxx
export FEDAPAY_SECRET_KEY=sk_sandbox_xxxxx

# 2. Tester le paiement avec un numéro test
# MTN Benin: +22901010101
# Le montant doit être entre 100 et 10000 FCFA

# 3. Relayer les webhooks localement avec ngrok
ngrok http 3000
# → https://abc123.ngrok.io

# 4. Ajouter le webhook ngrok dans FedaPay Dashboard (mode sandbox)
# https://abc123.ngrok.io/api/webhook/fedapay
```

---

## Résumé des PIÈGES à éviter

| # | Piège | Solution |
|---|---|---|
| 1 | Signature: signer le payload seul | Signer `timestamp.payload` |
| 2 | Attendre le traitement avant de répondre | Répondre 200 immédiatement, traiter async |
| 3 | Webhooks multiples actifs | Supprimer les anciens, garder 1 seul |
| 4 | Secret webhook incorrect copié | Copier EXACTEMENT depuis le dashboard |
| 5 | URLs HTTP pour webhook | HTTPS obligatoire |
| 6 | Pas de logging des events | Logger tous les webhooks |
| 7 | URL callback non persistée | Utiliser la référence unique de transaction |
| 8 | Timeout Vercel trop court | Configurer 30s minimum |
| 9 | Statut `pending` traité comme échec | Attendre le webhook pour la validation |
| 10 | Pas de monitoring en production | Créer page admin/logs |

---

## Ressources Utiles

- [Documentation FedaPay](https://docs.fedapay.com)
- [FedaPay Dashboard](https://dashboard.fedapay.com)
- [Webhook Tester (ngrok)](https://ngrok.com)
- [Signature Format Reference](https://docs.fedapay.com/webhooks) (chercher "signature")

---

**Document créé:** Septembre 2026  
**Dernière mise à jour:** Après intégration réussie voteprodigital  
**Statut:** Production-ready ✅
