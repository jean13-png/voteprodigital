# 🔄 Flux de Paiement FedaPay Corrigé

## 📊 Architecture Avant vs Après

### ❌ AVANT (Problématique)

```
Utilisateur paie
    ↓
FedaPay → [Webhook] → Votre serveur
                       ↓
                       Traite DB (2s)
                       ↓
                       Envoie emails (3s)
                       ↓
                       Répond 200 (total: 5s)
                       ↓
    ⏱️ TIMEOUT ! FedaPay n'attend pas 5s
    ❌ Webhook marqué comme échoué
    ❌ Vote reste "en_attente"
    ❌ Utilisateur redirigé vers /vote/failed
```

### ✅ APRÈS (Corrigé)

```
Utilisateur paie
    ↓
FedaPay → [Webhook] → Votre serveur
                       ↓
                       Vérifie signature (0.1s)
                       ↓
                       Répond 200 immédiatement ⚡
                       ↓
    ✅ FedaPay reçoit 200 OK
    ✅ Webhook marqué comme réussi
    
    En parallèle (arrière-plan) :
    ↓
    Traite DB (2s)
    ↓
    Envoie emails (3s)
    ↓
    ✅ Vote validé
    ✅ Utilisateur redirigé vers /vote/success
```

## 🔄 Flux Complet en Détail

### Étape 1 : Création du Vote

```
Utilisateur remplit formulaire
    ↓
POST /api/votes
    ↓
Crée un vote en DB (statut: en_attente)
    ↓
Appel API FedaPay
    ↓
FedaPay retourne :
  - transactionId
  - reference
  - paymentUrl
    ↓
Mise à jour du vote avec ces infos
    ↓
Redirection vers paymentUrl
```

**Code** : `src/app/api/votes/route.ts`

### Étape 2 : Paiement Mobile Money

```
Utilisateur sur page FedaPay
    ↓
Saisit son numéro Mobile Money
    ↓
Confirme le paiement
    ↓
Saisit son code PIN
    ↓
FedaPay traite le paiement (3-10 secondes)
```

### Étape 3 : Webhook FedaPay (Notification asynchrone)

```
FedaPay traite le paiement
    ↓
Paiement approuvé
    ↓
FedaPay envoie webhook à votre serveur
    ↓
POST /api/webhook/fedapay
Headers:
  - x-fedapay-signature: abc123...
Body:
  {
    "event": "transaction.approved",
    "entity": {
      "reference": "REF-XXX",
      "status": "approved",
      ...
    }
  }
    ↓
[Votre serveur]
  1. Lit le payload (0.05s)
  2. Vérifie la signature HMAC (0.05s)
  3. ✅ Répond 200 OK (TOTAL: 0.1s)
  4. En parallèle, traite :
     - Recherche le vote par reference
     - Met à jour le statut → "valide"
     - Envoie email admin
     - Envoie email votant
```

**Code** : `src/app/api/webhook/fedapay/route.ts`

**Fonction clé** :
```typescript
// Traitement asynchrone (ne bloque pas la réponse)
processWebhookAsync(entity, event, webhookLog).catch(...);

// Réponse immédiate à FedaPay
return NextResponse.json({ received: true }, { status: 200 });
```

### Étape 4 : Callback de Redirection

```
FedaPay redirige l'utilisateur
    ↓
GET /api/votes/callback/[id]
    ↓
[Votre serveur]
  1. Récupère le vote en DB
  2. Appelle API FedaPay pour vérifier le statut
  3. Si "approved" → Redirige vers /vote/success
  4. Si "declined/canceled" → Redirige vers /vote/failed
  5. Si "pending/started" → Redirige vers /vote/success?pending=true
    ↓
Utilisateur voit la page appropriée
```

**Code** : `src/app/api/votes/callback/[id]/route.ts`

## 🔀 Gestion des Race Conditions

### Problème potentiel

Le **callback** peut arriver **avant** le **webhook** (ou vice-versa).

### Solution : Idempotence

```typescript
// Dans le webhook
if (vote.statut === "valide" && event === "transaction.approved") {
  // Déjà traité → ignorer
  return NextResponse.json({ received: true });
}

// Dans le callback
if (vote.statut === "valide") {
  // Déjà traité par le webhook → juste rediriger
  return NextResponse.redirect(`${baseUrl}/vote/success`);
}
```

Les deux endpoints peuvent être appelés plusieurs fois sans effet de bord.

## 🎯 Statuts FedaPay

| Statut | Signification | Action |
|--------|---------------|--------|
| `pending` | En attente de traitement | Rediriger vers success avec message d'attente |
| `started` | Paiement en cours | Rediriger vers success avec message d'attente |
| `approved` | ✅ Paiement réussi | Valider le vote, envoyer emails |
| `declined` | ❌ Paiement refusé | Marquer comme refusé |
| `canceled` | ❌ Paiement annulé | Marquer comme refusé |
| `transferred` | Fonds transférés au marchand | Valider le vote |

## 🔐 Sécurité

### Vérification de Signature

```typescript
function verifyFedaPaySignature(payload: string, signature: string, secret: string) {
  // FedaPay utilise HMAC-SHA256 en hexadécimal
  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  
  return expectedSignature === signature;
}
```

**Important** :
- ✅ Toujours vérifier la signature **AVANT** de traiter
- ❌ Rejeter tout webhook sans signature valide (HTTP 401)
- 🔒 Le secret ne doit **JAMAIS** être exposé

### Headers requis

```
POST /api/webhook/fedapay
Content-Type: application/json
x-fedapay-signature: abc123def456...
```

## 📊 Monitoring

### Logs à vérifier

**Admin Webhook Logs** : `/admin/logs`

```json
{
  "event": "transaction.approved",
  "status": 200,
  "signatureValid": true,
  "signatureFormat": "SHA256-HEX",
  "payload": "{\"entity\":{...}}",
  "createdAt": "2026-09-26T10:30:00Z"
}
```

**Logs Vercel** : `vercel logs --follow`

```
[Callback] Vote ID: 123 | FedaPay status: approved | Vote status: en_attente
[processWebhookAsync] Vote #123 validé avec succès
```

### Métriques à surveiller

- ⚡ Temps de réponse webhook : < 1 seconde
- 📧 Temps d'envoi emails : < 5 secondes
- ✅ Taux de succès webhook : > 99%
- 🔄 Taux de votes validés automatiquement : 100%

## 🐛 Debugging

### Vote bloqué en "en_attente"

**Cause** : Le webhook n'est jamais arrivé ou a échoué

**Solution** :
```bash
# 1. Vérifier les logs webhook
curl https://voteprodigital.vercel.app/admin/logs

# 2. Exécuter le script de récupération
npm run check:votes

# 3. Ou renvoyer manuellement depuis FedaPay
# Dashboard → Webhooks → Renvoyer
```

### Webhook retourne 401 (signature invalide)

**Cause** : Le secret webhook ne correspond pas

**Solution** :
```bash
# Vérifier sur Vercel
vercel env ls

# Mettre à jour si nécessaire
vercel env add FEDAPAY_WEBHOOK_SECRET
vercel --prod
```

### Emails non reçus

**Cause** : Erreur dans l'envoi (Resend, SMTP)

**Solution** :
```bash
# Vérifier les logs
vercel logs --follow | grep "sendNewVoteNotification\|sendVoteReceipt"

# Vérifier la config Resend
# Dashboard → https://resend.com/logs
```

## 🚀 Performance

### Temps de traitement optimaux

| Étape | Temps |
|-------|-------|
| Vérification signature | < 100ms |
| Réponse webhook | < 200ms |
| Mise à jour DB | < 1s |
| Envoi emails | < 5s |
| **Total (perçu par utilisateur)** | **< 2s** |

### Optimisations appliquées

- ✅ Réponse immédiate au webhook (pas d'attente)
- ✅ Traitement asynchrone en arrière-plan
- ✅ Idempotence (évite les doublons)
- ✅ Timeout Vercel augmenté (30s)
- ✅ Emails en mode "fire and forget" (pas d'await)

## 📁 Fichiers Modifiés

```
src/app/api/webhook/fedapay/route.ts
  ↳ Réponse immédiate + traitement async

src/app/api/votes/callback/[id]/route.ts
  ↳ Gestion des paiements en cours

vercel.json
  ↳ Configuration timeout

scripts/check-pending-votes.ts
  ↳ Script de récupération des votes bloqués

package.json
  ↳ Ajout commande "check:votes"
```

---

**Version** : 1.0  
**Date** : 26 septembre 2026  
**Status** : ✅ Prêt pour production
