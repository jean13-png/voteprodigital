# 🔧 Correction du Webhook FedaPay

## 🔴 Problème Identifié

Les paiements FedaPay sont **bien effectués** (l'argent est prélevé), mais :
- Le webhook FedaPay ne recevait pas de réponse HTTP 200 à temps
- Les utilisateurs étaient redirigés vers la page d'échec
- Les votes étaient marqués comme "rejetés" dans l'admin

## ✅ Corrections Appliquées

### 1. **Webhook optimisé pour répondre rapidement**
**Fichier modifié** : `src/app/api/webhook/fedapay/route.ts`

**Changement principal** :
- Le webhook répond maintenant **immédiatement** avec HTTP 200 à FedaPay
- Le traitement (DB, emails) se fait **en arrière-plan** (asynchrone)
- Plus de timeout côté FedaPay ✅

**Avant** : 
```typescript
// Traiter tout (DB + emails) PUIS répondre → TIMEOUT ❌
await db.update()...
await sendEmails()...
return NextResponse.json({ received: true });
```

**Après** :
```typescript
// Répondre immédiatement, traiter en arrière-plan ✅
processWebhookAsync(...).catch(...);
return NextResponse.json({ received: true }, { status: 200 });
```

### 2. **Callback amélioré pour gérer les paiements en cours**
**Fichier modifié** : `src/app/api/votes/callback/[id]/route.ts`

**Problème** : Le callback marquait comme "refusé" tous les paiements qui n'étaient pas encore "approved"

**Solution** :
- Les statuts `pending`, `started`, `transferred` redirigent maintenant vers la **page de succès** avec un message d'attente
- Seuls les statuts `declined` et `canceled` redirigent vers la page d'échec
- Les logs sont ajoutés pour déboguer

### 3. **Configuration Vercel pour les webhooks**
**Nouveau fichier** : `vercel.json`

Configure un timeout de 30 secondes pour le webhook (au lieu de 10s par défaut)

## 📋 Étapes de Déploiement

### 1. Vérifier les variables d'environnement sur Vercel

```bash
FEDAPAY_SECRET_KEY=VOTRE_CLE_LIVE_ICI
FEDAPAY_MODE=live
FEDAPAY_WEBHOOK_SECRET=VOTRE_SECRET_WEBHOOK_ICI
NEXTAUTH_URL=https://voteprodigital.vercel.app
```

### 2. Déployer les changements

```bash
git add .
git commit -m "fix: Optimisation webhook FedaPay pour éviter les timeouts"
git push origin main
```

Le déploiement sur Vercel se fera automatiquement.

### 3. Tester le webhook manuellement depuis le dashboard FedaPay

1. Aller sur : https://live.fedapay.com/webhooks/8830
2. Cliquer sur "Renvoyer" pour une transaction test
3. Vérifier que le statut passe à **200 OK** (au lieu de timeout)

### 4. Tester un vrai paiement

1. Créer un vote de test avec un petit montant (ex: 100 XOF)
2. Payer via Mobile Money
3. Vérifier que :
   - L'utilisateur est redirigé vers `/vote/success` ✅
   - Le vote apparaît comme "validé" dans l'admin ✅
   - Les emails sont bien envoyés ✅

## 🐛 Debug en cas de problème

### Consulter les logs du webhook

**Page admin** : `/admin/logs`
Vous verrez :
- Les événements reçus
- Les signatures validées
- Les erreurs éventuelles

### Logs Vercel

```bash
vercel logs --follow
```

Ou dans le dashboard Vercel → votre projet → Logs

### Vérifier qu'une transaction est bien "approved" sur FedaPay

```bash
curl -X GET "https://api.fedapay.com/v1/transactions/TRANSACTION_ID" \
  -H "Authorization: Bearer VOTRE_CLE_SECRETE_ICI" \
  -H "X-Version: 1.1.1"
```

Remplacer `TRANSACTION_ID` par l'ID de la transaction (visible dans l'admin ou les logs).

## 📊 Ce qui devrait se passer maintenant

### Flux normal :

```
Utilisateur paie sur Mobile Money
    ↓
FedaPay traite le paiement (quelques secondes)
    ↓
FedaPay envoie webhook → votre serveur répond 200 OK immédiatement
    ↓
Traitement en arrière-plan (DB + emails)
    ↓
FedaPay redirige l'utilisateur vers /api/votes/callback/[id]
    ↓
Le callback vérifie le statut → "approved"
    ↓
Redirige vers /vote/success ✅
```

### En cas de paiement en cours (rare) :

```
Callback vérifie le statut → "pending" ou "started"
    ↓
Redirige quand même vers /vote/success avec ?pending=true
    ↓
Le webhook validera le vote quelques secondes plus tard ✅
```

## ⚠️ Important

### Ne PAS modifier le FEDAPAY_WEBHOOK_SECRET

FedaPay utilise ce secret pour signer les webhooks. Si vous le changez :
1. Mettez à jour la variable sur Vercel
2. Configurez le nouveau secret dans le dashboard FedaPay : https://live.fedapay.com/webhooks/8830

### Structure de réponse FedaPay

FedaPay retourne les données dans une clé `"v1/transaction"` :

```json
{
  "v1/transaction": {
    "id": 123,
    "status": "approved",
    "reference": "REF-XXX"
  }
}
```

Le code callback a été mis à jour pour gérer cette structure.

## 🎯 Prochaines étapes (recommandations)

1. **Monitoring** : Configurer des alertes pour les échecs de webhook
2. **Retry logic** : Si un webhook échoue côté DB, implémenter un système de retry
3. **Dashboard** : Ajouter un graphique des statuts de paiements dans l'admin
4. **Tests automatisés** : Créer des tests pour simuler les webhooks FedaPay

## 📞 Support FedaPay

En cas de problème persistant :
- Email : support@fedapay.com
- Documentation : https://docs.fedapay.com/developpement/webhooks
- Dashboard : https://live.fedapay.com

---

**Date de correction** : 26 septembre 2026  
**Version** : 1.0  
**Status** : ✅ Prêt pour le déploiement
