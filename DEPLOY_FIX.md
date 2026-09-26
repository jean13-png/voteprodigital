# 🚀 Déploiement de la Correction Webhook FedaPay

## ✅ Checklist Rapide

### 1. Vérifier les changements

```bash
git status
```

**Fichiers modifiés** :
- ✅ `src/app/api/webhook/fedapay/route.ts` - Réponse rapide au webhook
- ✅ `src/app/api/votes/callback/[id]/route.ts` - Gestion des paiements en cours
- ✅ `vercel.json` - Configuration timeout
- ✅ `FIX_WEBHOOK_FEDAPAY.md` - Documentation
- ✅ `test-webhook.sh` - Script de test

### 2. Tester en local (optionnel mais recommandé)

```bash
# Démarrer le serveur local
npm run dev

# Dans un autre terminal, tester le webhook
./test-webhook.sh REF-TEST-123

# Vérifier dans http://localhost:3000/admin/logs
```

### 3. Commit et déployer

```bash
git add .
git commit -m "fix: Optimisation webhook FedaPay - réponse immédiate pour éviter timeouts"
git push origin main
```

⏳ **Vercel déploiera automatiquement** (2-3 minutes)

### 4. Vérifier le déploiement

Aller sur : https://vercel.com/votre-projet/deployments

Attendre que le statut soit **Ready** ✅

### 5. Tester le webhook en production

**Option A : Via le dashboard FedaPay** (recommandé)

1. Aller sur https://live.fedapay.com/webhooks/8830
2. Chercher une transaction récente avec statut "approved"
3. Cliquer sur "Renvoyer le webhook"
4. Vérifier que le statut passe à **200 OK** (au lieu de timeout/erreur)

**Option B : Faire un vrai paiement test**

1. Créer un vote de test (100 XOF minimum)
2. Payer via Mobile Money
3. Vérifier :
   - Redirection vers `/vote/success` ✅
   - Vote marqué "validé" dans `/admin/votes` ✅
   - Emails reçus ✅

### 6. Vérifier les logs webhook

Aller sur : https://voteprodigital.vercel.app/admin/logs

Vous devriez voir :
- ✅ `signatureValid: true`
- ✅ `status: 200`
- ✅ `event: transaction.approved`

## 🐛 Si ça ne marche toujours pas

### Problème : Webhook retourne toujours timeout

**Cause possible** : Les variables d'environnement sur Vercel ne sont pas à jour

**Solution** :
```bash
# Via CLI Vercel
vercel env pull .env.vercel

# Ou vérifier manuellement sur :
# https://vercel.com/votre-projet/settings/environment-variables
```

Vérifier que ces variables existent :
- `FEDAPAY_SECRET_KEY=sk_live_...`
- `FEDAPAY_MODE=live`
- `FEDAPAY_WEBHOOK_SECRET=wh_live_...`

Après modification, **redéployer** :
```bash
vercel --prod
```

### Problème : Signature invalide

**Cause** : Le `FEDAPAY_WEBHOOK_SECRET` sur Vercel ne correspond pas à celui du dashboard FedaPay

**Solution** :
1. Aller sur https://live.fedapay.com/webhooks/8830
2. Copier le secret webhook
3. Mettre à jour sur Vercel :
   ```bash
   vercel env add FEDAPAY_WEBHOOK_SECRET
   # Coller le secret
   vercel --prod
   ```

### Problème : Votes toujours en "rejeté"

**Causes possibles** :
1. Le webhook n'arrive pas (firewall, URL incorrecte)
2. La signature est invalide
3. La référence FedaPay ne correspond pas

**Debug** :
```bash
# 1. Vérifier les logs webhook dans l'admin
# https://voteprodigital.vercel.app/admin/logs

# 2. Vérifier les logs Vercel
vercel logs --follow

# 3. Vérifier manuellement le statut d'une transaction
curl -X GET "https://api.fedapay.com/v1/transactions/TRANSACTION_ID" \
  -H "Authorization: Bearer sk_live_3KyG5_jI3QsfFqon1WzIDd8z" \
  -H "X-Version: 1.1.1" | jq .
```

## 📊 Logs à surveiller

### Logs Vercel (temps réel)

```bash
vercel logs --follow
```

**Ce que vous devriez voir** :
```
[Callback] Vote ID: 123 | FedaPay status: approved | Vote status: en_attente
[FedaPay] Téléphone brut: +22944970593 → envoyé: 0144970593
```

### Logs admin webhook

URL : https://voteprodigital.vercel.app/admin/logs

**Exemple de log réussi** :
```json
{
  "event": "transaction.approved",
  "status": 200,
  "signatureValid": true,
  "signatureFormat": "SHA256-HEX",
  "payload": "{\"entity\":{\"reference\":\"REF-XXX\"...}}"
}
```

**Exemple de log échoué** :
```json
{
  "event": "unknown",
  "status": 401,
  "signatureValid": false,
  "error": "Signature invalide. Tests: SHA256-HEX=false, SHA256-BASE64=false..."
}
```

## 🎯 Validation finale

### Checklist de test complet

- [ ] Webhook répond 200 OK dans le dashboard FedaPay
- [ ] Vote de test est validé automatiquement
- [ ] Email de notification reçu (admin)
- [ ] Email de reçu reçu (votant, si email fourni)
- [ ] Utilisateur redirigé vers `/vote/success`
- [ ] Vote visible dans `/admin/votes` avec statut "validé"
- [ ] Logs webhook propres (pas d'erreurs)

### Performance attendue

- ⚡ Réponse webhook < 1 seconde
- 📧 Emails envoyés en < 5 secondes
- 🔄 Validation complète en < 10 secondes

## 📞 Contact Support

### FedaPay
- Email : support@fedapay.com
- Dashboard : https://live.fedapay.com
- Docs : https://docs.fedapay.com

### Vercel
- Dashboard : https://vercel.com
- Docs : https://vercel.com/docs

---

**Last updated** : 26 septembre 2026  
**Version** : 1.0
