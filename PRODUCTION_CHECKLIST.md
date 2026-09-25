# 🚀 Checklist de Déploiement Production

## ✅ Variables d'environnement

### 🔴 CRITIQUE - À configurer ABSOLUMENT

#### 1. AUTH_SECRET
```bash
# Générer un secret fort (minimum 32 caractères)
openssl rand -base64 32
```
- ❌ NE PAS utiliser : `<ancien-secret-à-ne-pas-réutiliser>`
- ✅ Utiliser un secret aléatoire généré par la commande ci-dessus
- 📍 Définir dans les variables d'environnement de votre plateforme (Vercel, Railway, etc.)

#### 2. NEXTAUTH_URL
```bash
NEXTAUTH_URL=https://votre-domaine.com
```
- ❌ NE PAS utiliser `http://localhost:3000`
- ✅ URL complète avec HTTPS de votre application en production

#### 3. DATABASE_URL
```bash
DATABASE_URL=postgresql://user:password@host/database?sslmode=require&channel_binding=require
```
- ✅ Votre URL Neon actuelle semble correcte
- ⚠️ Vérifier que `sslmode=require` est bien présent
- ⚠️ Considérer `channel_binding=require` pour plus de sécurité

#### 4. CLOUDINARY (Configurées ✅)
```bash
CLOUDINARY_CLOUD_NAME=<votre_cloud_name>
CLOUDINARY_API_KEY=<votre_api_key>
CLOUDINARY_API_SECRET=<votre_api_secret>
```
- ✅ Déjà configurées correctement

#### 5. RESEND (Emails)
```bash
RESEND_API_KEY=re_votre_vraie_clé
EMAIL_FROM=noreply@votre-domaine.com
ADMIN_EMAIL=admin@votre-domaine.com
```
- ⚠️ Vérifier que `EMAIL_FROM` utilise un domaine vérifié dans Resend
- ⚠️ Configurer SPF/DKIM pour le domaine

#### 6. FEDAPAY (Paiements)
```bash
FEDAPAY_SECRET_KEY=sk_live_xxxxxxxxxx
FEDAPAY_MODE=live
FEDAPAY_WEBHOOK_SECRET=votre_secret_webhook
```
- 🔴 **CRITIQUE** : Passer de `sandbox` à `live` en production
- 🔴 Utiliser la clé `sk_live_xxx` (pas `sk_sandbox_xxx`)
- ✅ Configurer un webhook secret fort

---

## 🔒 Sécurité NextAuth

### Configuration actuelle à vérifier

```typescript
// src/lib/auth.ts
{
  secret: process.env.AUTH_SECRET,  // ✅ Bon
  trustHost: true,                  // ⚠️ À vérifier
  session: {
    strategy: "jwt",                // ✅ Bon
    maxAge: 30 * 24 * 60 * 60,     // ✅ 30 jours OK
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,             // ✅ Bon
        sameSite: "lax",           // ✅ Bon
        secure: NODE_ENV === "production", // ✅ Bon
      },
    },
  },
}
```

### ⚠️ Point d'attention : `trustHost: true`

**Option 1 (Recommandée) :** Spécifier les hosts autorisés
```typescript
trustHost: process.env.NODE_ENV === "production" 
  ? false 
  : true,
// Et définir AUTH_URL explicitement
```

**Option 2 :** Garder `trustHost: true` si vous utilisez Vercel/Railway qui gèrent les proxies

---

## 🛡️ Sécurité des Routes API

### ✅ Protection actuelle
Toutes les routes admin utilisent maintenant :
```typescript
const session = await getSession();
if (!session || session.user?.role !== "admin") {
  return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
}
```

### ⚠️ Points à vérifier

1. **Rate Limiting** (recommandé pour la prod)
   - Ajouter un middleware pour limiter les tentatives de connexion
   - Protéger les routes de vote contre le spam

2. **CORS**
   - Vérifier que seules les origines autorisées peuvent appeler vos API

---

## 💾 Base de Données

### ✅ Configuration actuelle Neon
```
sslmode=require&channel_binding=require
```
- ✅ SSL activé
- ✅ Channel binding activé
- ✅ Connection pooling via Neon

### Recommandations

1. **Backups automatiques**
   - Vérifier que Neon fait des backups automatiques
   - Tester la restauration

2. **Migrations**
   ```bash
   npm run db:push  # Pour pousser le schéma en prod
   ```

---

## 📤 Uploads Cloudinary

### ✅ Sécurité actuelle
- `isCloudinaryConfigured()` vérifie la présence des clés
- Les uploads sont limités aux admins

### ⚠️ Recommandations pour la prod

1. **Validation des fichiers**
   - Taille maximale actuelle : illimitée
   - Types de fichiers : non validés côté serveur

**À AJOUTER** dans `/src/lib/cloudinary.ts` :
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Fichier trop volumineux (max 5 MB)' };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Type de fichier non autorisé' };
  }
  return { valid: true };
}
```

2. **Nettoyage des fichiers orphelins**
   - Prévoir un script pour supprimer les images non utilisées

---

## 📧 Configuration Email (Resend)

### Points critiques

1. **Domaine vérifié**
   - Se connecter à https://resend.com/domains
   - Ajouter votre domaine
   - Configurer les enregistrements DNS (SPF, DKIM)

2. **Validation EMAIL_FROM**
   ```bash
   # EMAIL_FROM doit utiliser le domaine vérifié
   EMAIL_FROM=noreply@votre-domaine-verifie.com
   ```

3. **Gestion des erreurs**
   - Les erreurs d'envoi sont loguées mais ne bloquent pas l'app
   - Prévoir un monitoring des emails non envoyés

---

## 💳 FedaPay (Paiements Mobile Money)

### 🔴 CRITIQUE : Passer en mode LIVE

#### Configuration actuelle (DEV)
```bash
FEDAPAY_MODE=sandbox
FEDAPAY_SECRET_KEY=sk_sandbox_xxx
```

#### Configuration PRODUCTION
```bash
FEDAPAY_MODE=live
FEDAPAY_SECRET_KEY=sk_live_xxxxxxxxxx
FEDAPAY_WEBHOOK_SECRET=un_secret_fort_aleatoire
```

### Webhooks

1. **Configurer l'URL webhook dans FedaPay**
   ```
   https://votre-domaine.com/api/webhooks/fedapay
   ```

2. **Vérifier la signature webhook**
   - Le code doit vérifier `FEDAPAY_WEBHOOK_SECRET`
   - Ne jamais faire confiance à un webhook non signé

3. **Tester en sandbox d'abord**
   - Faire des transactions test
   - Vérifier que les webhooks arrivent
   - Puis basculer en `live`

---

## 🪵 Logs et Debug

### ⚠️ À SUPPRIMER en production

Rechercher et supprimer les logs sensibles :
```typescript
// ❌ À supprimer en prod
console.log("[NextAuth] jwt callback", { token, user });
console.log("[admin/candidats] auth() session", session);
```

### ✅ Logs à garder
```typescript
// ✅ Erreurs importantes
console.error("[NextAuth] credentials.authorize error", e);
logError("Create candidate", err);
```

### Recommandation
Utiliser une condition globale :
```typescript
const isDev = process.env.NODE_ENV !== "production";
if (isDev) console.log("[Debug]", data);
```

---

## 🔐 Sécurité Générale

### Headers de sécurité (next.config.ts)

Ajouter des headers de sécurité :
```typescript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ];
}
```

---

## 📋 Checklist finale avant déploiement

- [ ] Générer et configurer un nouveau `AUTH_SECRET`
- [ ] Définir `NEXTAUTH_URL` avec l'URL de production
- [ ] Vérifier `DATABASE_URL` avec SSL activé
- [ ] Passer FedaPay en mode `live` avec la bonne clé
- [ ] Configurer et vérifier le domaine dans Resend
- [ ] Configurer l'URL webhook FedaPay
- [ ] Ajouter la validation des fichiers uploadés
- [ ] Supprimer les logs de debug sensibles
- [ ] Ajouter les headers de sécurité
- [ ] Tester toutes les fonctionnalités en staging
- [ ] Configurer le monitoring des erreurs
- [ ] Documenter le processus de rollback

---

## 🚨 En cas de problème en production

1. **Vérifier les logs de la plateforme**
   - Vercel : https://vercel.com/dashboard → Logs
   - Railway : https://railway.app → Logs

2. **Variables d'environnement**
   - Toutes les variables sont-elles définies ?
   - Pas d'espace avant/après les valeurs ?

3. **Rollback rapide**
   - Garder la version précédente déployée
   - Bouton "Rollback" dans Vercel/Railway

---

## 📞 Contacts Support

- **NextAuth** : https://github.com/nextauthjs/next-auth/discussions
- **Neon** : https://neon.tech/docs
- **Cloudinary** : https://support.cloudinary.com
- **Resend** : https://resend.com/support
- **FedaPay** : https://fedapay.com/support

---

**Date de création :** $(date)
**Dernière mise à jour :** À mettre à jour après chaque déploiement
