# 🔒 Audit de Sécurité des Routes API

## ✅ Routes Admin (Toutes Protégées)

Toutes les routes `/api/admin/**` vérifient systématiquement :
```typescript
const session = await getSession();
if (!session || session.user?.role !== "admin") {
  return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
}
```

### Liste des routes admin protégées :
- ✅ `POST /api/admin/candidats` - Création candidat
- ✅ `PUT /api/admin/candidats/[id]` - Modification candidat
- ✅ `DELETE /api/admin/candidats/[id]` - Suppression candidat
- ✅ `PATCH /api/admin/candidats/[id]/toggle` - Activation/désactivation
- ✅ `PATCH /api/admin/votes/[id]/valider` - Validation vote
- ✅ `PATCH /api/admin/votes/[id]/refuser` - Refus vote

---

## 🛡️ Routes Publiques avec Protection

### 1. Authentification (Rate Limited)

#### `POST /api/auth/admin/login` (Server Action)
- ✅ Rate limiting : **5 tentatives / 15 minutes** par IP + email
- ✅ Reset du compteur après connexion réussie
- ✅ Message d'erreur générique (ne révèle pas si l'email existe)

#### `POST /api/auth/candidate/login` (Server Action)
- ✅ Rate limiting : **5 tentatives / 15 minutes** par IP + email
- ✅ Reset du compteur après connexion réussie

#### `POST /api/auth/forgot-password`
- ✅ Rate limiting : **3 tentatives / heure** par email
- ✅ Réponse identique que l'email existe ou non (évite énumération)
- ⚠️ Validation email format

#### `POST /api/auth/reset-password`
- ✅ Rate limiting : **5 tentatives / 15 minutes** par token
- ✅ Validation mot de passe minimum 8 caractères
- ✅ Token avec expiration

---

### 2. Votes (Anti-Spam)

#### `POST /api/votes`
- ✅ **Idempotency** : clé unique basée sur candidat + téléphone + nombre de votes
- ✅ Prévention double-soumission : **15 secondes** de délai
- ✅ Détection duplicatas récents en base de données
- ✅ Validation stricte :
  - Nombre de votes : entre 1 et 100
  - Format téléphone : 10 chiffres commençant par 0
  - Format email (si fourni)
- ✅ Vérification candidat actif
- ⚠️ Pas de rate limiting par IP (pourrait être ajouté)

---

### 3. Webhooks (Signature Vérifiée)

#### `POST /api/webhook/fedapay`
- ✅ Vérification signature FedaPay (`x-fedapay-signature`)
- ✅ Rejet si signature invalide (401)
- ✅ Vérification secret configuré
- ✅ Idempotence : ignore les doublons d'événements
- ⚠️ Logging des erreurs

**Configuration requise :**
```bash
FEDAPAY_WEBHOOK_SECRET=votre_secret_fort
```

---

### 4. Profil Candidat (Protégé)

#### `PUT /api/candidat/profil`
- ✅ Vérifie session et rôle "candidate"
- ✅ Validation des données
- ✅ Upload photo sécurisé (Cloudinary)

---

## ⚠️ Recommandations Supplémentaires

### 1. Rate Limiting Général
Actuellement, le rate limiting est en **mémoire** (Map JavaScript). 

**Pour la production avec plusieurs instances :**
- [ ] Utiliser Redis pour le rate limiting distribué
- [ ] Ou utiliser un service comme Upstash ou Vercel KV

### 2. CORS (Cross-Origin Resource Sharing)
Actuellement non configuré. Si votre frontend est sur un domaine différent :
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const origin = request.headers.get("origin");
  
  // Whitelist des origines autorisées
  const allowedOrigins = [
    "https://votre-domaine.com",
    "https://www.votre-domaine.com",
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  
  return response;
}
```

### 3. Protection CSRF
NextAuth gère déjà le CSRF pour les routes d'authentification. Pour les autres routes sensibles, considérer :
- [ ] Tokens CSRF pour les formulaires publics
- [ ] SameSite=Lax pour les cookies (déjà configuré ✅)

### 4. Validation des Entrées
- ✅ Validation email, téléphone, nombre de votes
- ✅ Sanitization basique
- ⚠️ Considérer l'utilisation de Zod pour validation plus robuste

Exemple avec Zod :
```typescript
import { z } from "zod";

const VoteSchema = z.object({
  candidatId: z.number().int().positive(),
  nomVotant: z.string().min(2).max(100),
  telephone: z.string().regex(/^0[1-9][0-9]{8}$/),
  email: z.string().email().optional(),
  nombreVotes: z.number().int().min(1).max(100),
});
```

### 5. Logs et Monitoring
- ✅ Logs d'erreurs avec `logError()`
- ⚠️ Pas de monitoring centralisé
- [ ] Considérer Sentry ou similaire pour tracking des erreurs en production

### 6. Limite de Taille des Requêtes
- ✅ Server Actions : limite 10MB configurée
- ⚠️ Routes API : utiliser Next.js body size limit

```typescript
// next.config.ts
export default {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Ajuster selon besoin
    },
  },
}
```

---

## 🔐 Points de Vigilance Production

### 1. Variables d'Environnement Sensibles
```bash
# À REGÉNÉRER avant production
AUTH_SECRET=<nouveau-secret-fort-32-chars>

# À vérifier
FEDAPAY_MODE=live  # Passer de 'sandbox' à 'live'
FEDAPAY_SECRET_KEY=sk_live_xxx  # Utiliser clé live
FEDAPAY_WEBHOOK_SECRET=<secret-fort-aleatoire>
```

### 2. Headers de Sécurité
✅ Déjà configurés dans `next.config.ts` :
- HSTS
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy
- Content-Security-Policy

### 3. HTTPS Obligatoire
- ✅ Cookies secure en production
- ✅ HSTS configuré
- ⚠️ S'assurer que le domaine force HTTPS

---

## 📊 Résumé de l'Audit

| Catégorie | Status | Note |
|-----------|--------|------|
| Routes Admin | ✅ | Toutes protégées |
| Auth Login | ✅ | Rate limited |
| Password Reset | ✅ | Rate limited |
| Vote Submission | ✅ | Anti-spam + idempotence |
| Webhooks | ✅ | Signature vérifiée |
| Headers Sécurité | ✅ | CSP, HSTS, etc. |
| Input Validation | ⚠️ | Basique, améliorer avec Zod |
| Rate Limiting | ⚠️ | En mémoire, passer à Redis en prod |
| CORS | ⚠️ | Non configuré (si nécessaire) |
| Monitoring | ❌ | À ajouter (Sentry) |

**Score global : 8/10** 🎯

L'application est **prête pour la production** avec quelques améliorations recommandées pour scale.

---

**Dernière mise à jour :** $(date)
