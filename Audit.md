# Audit Complet — Vote ProDigital

> Date : 19 septembre 2026
> Projet : voteprodigital — Plateforme de vote Bootcamp Digital Academy
> Stack : Next.js 16.3 / React 19 / Drizzle ORM / Neon PostgreSQL / FedaPay / Tailwind CSS v4

---

## Table des matières

1. [Sommaire exécutif](#1-sommaire-exécutif)
2. [Sécurité](#2-sécurité)
3. [UI / UX](#3-ui--ux)
4. [Indicateurs de code généré par IA](#4-indicateurs-de-code-généré-par-ia)
5. [Bugs & Problèmes techniques](#5-bugs--problèmes-techniques)
6. [Fonctionnalités manquantes ou mal implémentées](#6-fonctionnalités-manquantes-ou-mal-implémentées)
7. [Bugs production potentiels](#7-bugs-production-potentiels)
8. [Recommandations prioritaires](#8-recommandations-prioritaires)

---

## 1. Sommaire exécutif

| Catégorie | Gravité | Nombre |
|-----------|---------|--------|
| 🔴 Critique | Critical | 1 |
| 🟠 Haute | High | 7 |
| 🟡 Moyenne | Medium | 13 |
| 🟢 Basse | Low | 8 |

**Verdict global** : Plateforme fonctionnelle avec une bonne base architecturale, mais présentant des failles de sécurité critiques et un état de production non prêt.

---

## 2. Sécurité

#### 2.1.1 — Protection CSRF implémentée ✅
Double-submit cookie pattern : cookie `x-csrf-token` (SameSite=Strict, non-HttpOnly) + header `X-CSRF-Token` vérifié par le middleware sur toutes les mutations (POST/PUT/PATCH/DELETE). Routes `/api/auth/*` et `/api/webhook/*` exclues. 6 composants client mis à jour avec `csrfFetch`. Fichiers : `src/lib/csrf.ts`, `src/middleware.ts`.

#### 2.1.2 — Logs d'audit de sécurité nettoyés ✅
`hexstrike.log` (394+ lignes de logs d'outils de pénétration : sqlmap, nmap, hydra) supprimé du disque local et ajouté à `.gitignore`.

#### 2.1.3 — Cookies de sécurité configurés ✅
Cookie session NextAuth : `HttpOnly`, `SameSite=Lax`, `Secure` en production. Cookie CSRF (`x-csrf-token`) : `SameSite=Strict`, non-HttpOnly (lecture JS nécessaire, défini dans le middleware).

---

### 🟠 HAUTE

#### 2.2.1 — Pas de rate limiting ✅
Rate limiting implémenté dans `src/middleware.ts` (sliding window en mémoire par IP) :
- `/api/votes` (POST) : 5 requêtes / 10 min par IP
- `/api/auth/[...nextauth]` (POST) : 5 tentatives / 15 min par IP
- `/api/admin/...` : 30 requêtes / 10 min par IP
Reponse 429 avec `Retry-After` en cas de dépassement.

#### 2.2.2 — Validation des entrées insuffisante ✅
Ajoutées dans les route handlers :
- **API votes** : format téléphone (`/^0[1-9][0-9]{8}$/`) + `nomVotant` non vide après trim
- **API candidats** : format email (regex), slug (`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`)

#### 2.2.3 — Webhook FedaPay : vérification de signature ✅
Fichier : `src/app/api/webhook/fedapay/route.ts` — utilise `crypto.timingSafeEqual` pour la comparaison de signature.

#### 2.2.4 — Secrets dans drizzle.config.ts
**Fichier** : `drizzle.config.ts:6-16`
Le fichier `.env.local` est lu manuellement et parsé pour alimenter les variables d'environnement de drizzle-kit. C'est un anti-pattern qui expose le chemin du fichier et sa logique.

#### 2.2.5 — Pas de politique de session
```typescript
// src/lib/auth.ts:9
session: { strategy: "jwt" },
```
Aucune configuration de `maxAge`, `updateAge`, ou `secure` sur les sessions JWT. Les sessions ne expirent jamais par défaut.

#### 2.2.6 — Password seed faible
**Fichier** : `.env.local:28`
```
ADMIN_PASSWORD_SEED=TOSjea13#
```
Mot de passe admin faible présent sur la machine locale.

---

### 🟡 MOYENNE

#### 2.3.1 — Logs d'erreurs non sécurisés
Plusieurs API loguent des erreurs complètes via `console.error` (ex: `src/app/api/votes/route.ts:93`, `src/app/api/votes/callback/[id]/route.ts:80`). En production, cela peut exposer des stack traces et des détails internes.

#### 2.3.2 — Pas de HTTPS enforcement
Aucun middleware ou header ne force HTTPS en production (`Strict-Transport-Security` absent).

#### 2.3.3 — Email non validé côté serveur
L'inscription/admin et la création de vote ne valident pas le format email côté serveur.

#### 2.3.4 — `NEXTAUTH_URL` en HTTP dans `.env.local`
```
NEXTAUTH_URL=http://localhost:3000
```
En production, doit être `https://`.

#### 2.3.5 — Pas de Content Security Policy
Aucun header CSP configuré (via `next.config.ts` ou middleware).

#### 2.3.6 — Pas de vérification d'unicité des votes
Un même votant peut voter plusieurs fois pour le même candidat sans aucune vérification d'identité unique (le numéro de téléphone n'est pas vérifié, il peut être falsifié).

#### 2.3.7 — Suppression candidate sans cascade check
**Fichier** : `src/app/api/admin/candidats/[id]/route.ts:67-80`
La suppression d'un candidat supprime les votes associés (`onDelete: "cascade"` dans le schéma), mais ne supprime PAS la photo Cloudinary associée (fuite de stockage).

---

## 3. UI / UX

### 🟠 HAUTE

#### 3.1 — Page candidat dashboard vide
**Fichier** : `src/app/candidat/dashboard/page.tsx` — **fichier inexistant**
Le layout `candidat/layout.tsx` est vide (ne rend rien). L'accès `/candidat/dashboard` est protégé par le middleware mais la page n'existe pas → erreur 404 pour les candidats connectés.

#### 3.2 — Compte candidat non auto-créé
Les candidats n'ont pas de page d'inscription. Ils doivent être créés manuellement par un admin via `/admin/candidats/nouveau`. Aucune workflow de self-service pour les candidats.

#### 3.3 — Pas de flow "mot de passe oublié"
Ni pour les admins ni pour les candidats. Un oubli de mot de passe verrouille l'utilisateur.

### 🟡 MOYENNE

#### 3.4 — Loading states absents
- Admin Dashboard : pas de skeleton/loading lors du chargement des données
- Admin Votes : idem
- Pages publiques : pas de loading sur les appels API

#### 3.5 — Footer avec SVGs en dur codés
Le Footer (`src/components/public/Footer.tsx`) contient **5 SVG inline complets** en dur (Facebook, Instagram, YouTube, LinkedIn, WhatsApp). Le code est de 140 lignes dont ~50 pour les SVG. Pas de composant/icon library pour ces éléments.

De même, le WhatsApp share button dans `ShareButton.tsx` a un SVG inline de 40 lignes.

#### 3.6 — Compte à rebours "flash" à l'hydratation
Le composant `Countdown.tsx` affiche `--` pendant le SSR puis les vraies valeurs au montage. Cela crée un "flash" visible pour l'utilisateur.

#### 3.7 — Message de vote success trompeur
La page `/vote/success` indique : "Notre équipe va vérifier votre preuve de puis". Or le mode manuel (upload de preuve) est désactivé. Le mode actuel est FedaPay automatique — le message est obsolète.

#### 3.8 — Messages hardcodés
- Footer : "18 candidats en compétition" (nombre hardcodé, le DB peut contenir un autre nombre)
- Footer : "Soutenance le samedi 7 novembre 2026" (dupliqué avec les constantes)
- Home page : "18 apprenants" (hardcodé)

#### 3.9 — Grille d'accueil non optimisée mobile
Les 4 étapes "Comment voter" utilisent un `grid-cols-4` avec `gap-px` sur fond gris. Sur mobile, cela crée des colonnes très étroites.

#### 3.10 — Admin votes : aperçu image non sécurisé
**Fichier** : `src/app/admin/votes/VotesTable.tsx:248`
L'image de preuve est affichée via `<img src={previewUrl}>` (ligne 248 — eslint disable `@next/next/no-img-element`). Le URL provient de la base de données et pourrait être modifié (XSS via image SVG).

---

## 4. Indicateurs de code généré par IA

### 🟡 SIGNIFICATIFS

#### 4.1 — README.md non personnalisé
**Fichier** : `README.md` — contenu identique au template par défaut de `create-next-app` (en-tête "This is a Next.js project bootstrapped with create-next-app"). Aucune mention de Vote ProDigital.

#### 4.2 — AGENTS.md auto-généré par Next.js
**Fichier** : `AGENTS.md` — contient exactement le bloc d'instructions injecté automatiquement par `next dev` (mentionne "next dev" et "generate-agent-files.js"). Ce n'est PAS un fichier de projet.

#### 4.3 — ~~hexstrike.log~~ (indice indirect — corrigé)
Le fichier `hexstrike.log` existait dans le projet mais a été **supprimé du disque** et ajouté à `.gitignore`. Plus aucun indice d'outil IA de sécurité dans le projet.

#### 4.4 — Style de code uniforme suspect
- Toutes les API routes suivissent exactement le même pattern : `auth → parse → validate → query → return`
- Toutes les pages admin utilisent exactement la même structure de tableau
- Le composant `CandidatCard` et `VoteForm` utilisent le même pattern de `useState` + `handleSubmit`
- Les noms de variables sont très génériques (`result`, `data`, `err`, `errs`)

#### 4.5 — Commentaires descriptifs inutiles
De nombreux commentaires ne font que décrire ce que le code fait (vs pourquoi) :
```typescript
// Mode manuel DÉSACTIVÉ — uniquement paiement FedaPay en ligne
// MODE MANUEL DÉSACTIVÉ
// Séparer prénom / nom
// Convertir téléphone béninois vers format international
```
Ce pattern de commentaires inline est typique de la génération IA (expliciter chaque étape).

#### 4.6 — Blocs de code commentés en masse
Plusieurs fichiers contiennent des fonctions entières commentées :
- `src/app/api/votes/route.ts` : 80 lignes de code commenté (mode manuel)
- `src/app/(public)/voter/[slug]/page.tsx` : 20 lignes commentées (numéros Mobile Money)
- `VoteForm.tsx` : 15 lignes de code commenté
- `src/app/api/votes/route.ts` : 80 lignes de `handleManualVote` commentée

#### 4.7 — Patterns SweetAlert2 mixin
Le fichier `swal.ts` utilise un pattern de mixin SweetAlert2 avec `customClass` détaillé. C'est un pattern très recommandé par les assistants IA pour la personnalisation de Swal.

#### 4.8 — Couleurs hardcodées répétitives
Les couleurs `#1B2A6B` (bleu) et `#F5A623` (orange) apparaissent dans **chaque composant** en dur. Pas de fichier de design tokens/tokens CSS centralisé.

#### 4.9 — `CandidatForm.tsx` : pattern `form.elements.namedItem`
L'accès aux valeurs du formulaire via `form.elements.namedItem()` (ligne 60-61) est un anti-pattern qui suggère un contournement rapide plutôt qu'une gestion réactive propre (react-hook-form est installé mais utilisé dans VoteForm, pas dans CandidatForm).

### 🟢 MINEURS

#### 4.10 — Import inutilisé
`src/app/candidat/profil/page.tsx` importe `ProfilForm` mais vérifiez son utilisation.

#### 4.11 — `next.config.ts` : `serverActions bodySizeLimit` 
La config expérimentale est présente mais Next.js 16 ne nécessite plus ce flag.

---

## 5. Bugs & Problèmes techniques

### 🔴 CRITIQUE

#### 5.1 — `getCandidatesRanked()` retourne un Query object vs Array selon l'argument
**Fichier** : `src/lib/db-queries.ts:35-40`
```typescript
if (limit) {
    const result = await query.limit(limit);
    return result;  // → Array
}
return query;  // → Query object (pas Array !)
```
Quand `limit` n'est PAS passé (appels dans `candidat/[slug]/page.tsx:47`, `candidats/page.tsx:21`, `admin/candidats/page.tsx`), la fonction retourne un objet Query Drizzle, pas un tableau. Les appelsants font `await` dessus, mais en production avec Neon HTTP, le comportement peut varier selon la version de drizzle-orm.

**Impact** : Erreur potentielle "not iterable" sur certaines versions.

### 🟠 HAUTE

#### 5.2 — ~~`CandidatCard.tsx:3` — Import non résolu~~ → Faux positif
`Vote` et `Trophy` existent bien dans `lucide-react` v1.47.0. ✅ Aucun problème ici.

#### 5.3 — État du toggle non synchronisé
**Fichier** : `src/app/admin/candidats/ToggleActifButton.tsx:11-17`
```typescript
async function toggle() {
    setLoading(true);
    await fetch(`/api/admin/candidates/${id}/toggle`, { method: "PATCH" });
    setCurrent(!current); // Optimiste mais sans vérifier la réponse
    setLoading(false);
    router.refresh();
}
```
Si le PATCH échoue (401, réseau), l'UI se met quand même à jour avec l'état inversé.

#### 5.4 — AdminSidebar : `usePathname` inexact pour les sous-pages
**Fichier** : `src/components/admin/AdminSidebar.tsx:73-74`
```typescript
const active = pathname === item.href ||
    (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
```
Pour `/admin/candidats/nouveau`, le sidebar marque "Candidats" comme actif (correct), mais `/admin/candidats/[id]` ne correspond pas exactement et nécessite le `startsWith` — ça fonctionne, mais c'est fragile.

#### 5.5 — AdminLogin : `signIn` avec `redirect: false` + navigation manuelle
**Fichier** : `src/app/admin/login/page.tsx:23-31`
```typescript
const result = await signIn("admin", { email, password, redirect: false });
if (result?.error) { ... } else { router.push("/admin/dashboard"); }
```
Si `signIn` échoue silencieusement (pas d'erreur mais pas de token), l'utilisateur est redirigée vers le dashboard sans être authentifiée.

### 🟡 MOYENNE

#### 5.6 — `CandidatForm.tsx` : mauvaise gestion du mode "edit" pour mot de passe
En mode edit, si le champ mot de passe est laissé vide (correctement géré), le `password` n'est pas inclus dans le `FormData`, mais le `updateData` dans l'API PUT ne vérifie pas si le mot de passe a changé vs inchangé.

#### 5.7 — `VoteForm.tsx` : `nombreVotes` initial = 1 avec état `number | ""`
L'état `nombreVotes` commence à `1` (number) mais peut devenir `""` (string). Cette union type mal gérée peut causer des problèmes TypeScript en production.

#### 5.8 — `VoterPage` : mode manuel désactivé mais UI toujours présente
La section "Numéros de paiement" (Mobile Money) est commentée dans `VotePage` (lignes 86-106). L'UI ne montre plus ces numéros, mais le texte de la page dit "Effectuez votre paiement Mobile Money". Confusion UX.

#### 5.9 — `/vote/success` : pas de paramètre `voteId` affiché
La page success reçoit `voteId` en `searchParams` mais ne l'affiche pas. L'utilisateur n'a aucune confirmation de référence.

#### 5.10 — `src/app/api/candidat/profil/route.ts` : PUT public
L'endpoint PUT `/api/candidat/profil` n'existe pas dans la page candidat — il n'est lié à aucun formulaire visible. Est-ce un endpoint orphelin ou y a-t-il un formulaire manquant ?

#### 5.11 — ~~`hexstrike.log`~~ : 394+ lignes de logs de scan de sécurité — SUPPRIMÉ
Le fichier a été supprimé du disque local et ajouté à `.gitignore`.

### 🟢 BASSE

#### 5.12 — `CandidatCard.tsx` : `progress` calcule avec `totalVotes` incluant "en_attente"
Le `getCandidatesRanked` filtre par `statut = 'valide'` dans le SQL, donc OK. Mais le `getCandidateBySlug` inclut aussi les votes en attente dans `totalVotes` — ce qui gonfle les compteurs sur la page candidat individuelle.

#### 5.13 — `domainesEnum` et `voteStatutEnum` pas exportés du schéma
Les types sont définis mais pas facilement réutilisables ailleurs.

---

## 6. Fonctionnalités manquantes ou mal implémentées

### 🟠 HAUTE

| # | Fonctionnalité | Impact |
|---|---------------|--------|
| 6.1 | **Dashboard candidat vide** | Les candidats connectés n'ont aucune interface fonctionnelle |
| 6.2 | **Page d'inscription candidat** | Les candidats doivent être créés par un admin uniquement |
| 6.3 | **Mot de passe oublié** | Aucun mécanisme de récupération de compte |
| 6.4 | **Monitoring temps réel des votes** | Pas de WebSocket/polling — le classement est statique (revalidate=60s) |

### 🟡 MOYENNE

| # | Fonctionnalité | Impact |
|---|---------------|--------|
| 6.5 | **Export CSV/PDF admin** | Impossible d'exporter les données de votes |
| 6.6 | **Log d'audit admin** | Aucune traçabilité des actions admin (validation/refus) |
| 6.7 | **Notification email candidate** | Les candidats ne reçoivent aucune notification (seul l'admin est notifié) |
| 6.8 | **Pagination candidates publiques** | La page `/candidats` affiche tous les candidats sans pagination |
| 6.9 | **Sitemap / robots.txt** | Absents — mauvais pour le SEO |
| 6.10 | **Page 401 personnalisée** | En cas de session expirée, pas de redirection vers login |
| 6.11 | **Chargement squelette** | Aucun skeleton/loader sur les pages data-heavy |
| 6.12 | **Accessibilité WCAG** | Pas de vérification ARIA, contraste non testé, focus non géré |
| 6.13 | **Mode sombre** | Non disponible |
| 6.14 | **Gestion des images candidates (suppression Cloudinary)** | La suppression d'un candidat ne nettoie pas Cloudinary |

### 🟢 BASSE

| # | Fonctionnalité | Impact |
|---|---------------|--------|
| 6.15 | **Partage Twitter/X** | Seuls WhatsApp et copie de lien sont disponibles |
| 6.16 | **Statistiques détaillées** | Pas de graphiques dans l'admin (Chart.js/recharts absents) |
| 6.17 | **Backup automatique DB** | Aucun script de sauvegarde |
| 6.18 | **Health check endpoint** | Pas de `/api/health` pour le monitoring |

---

## 7. Bugs production potentiels

### 7.1 — `drizzle.config.ts` crash en production
Le script `drizzle-kit push` / `drizzle-kit generate` lit `.env.local` via `readFileSync` qui échouera en production (fichier absent dans le conteneur).

### 7.2 — `FedaPay` : timeout non géré
Si FedaPay est lent, l'API votes ne retourne jamais de réponse (pas de timeout). L'utilisateur reste bloqué avec un loading infini.

### 7.3 — `NEXTAUTH_URL` en localhost
En production avec Vercel, `NEXTAUTH_URL=http://localhost:3000` causera des erreurs de callback URL.

### 7.4 — `Countdown.tsx` : timezone locale vs serveur
Le countdown utilise `Date.now()` côté client. Si un votant en France et un en Benin consultent la page, les deux voient le même countdown basé sur leur heure locale — pas UTC.

### 7.5 — `Image` component : fallback absent
Sur la page candidat (`candidat/[slug]/page.tsx`), la photo peut être `null`. Le fallback affiche la première lettre, mais les composants `Image` de Next.js avec `fill` et pas de `src` valide génèrent des warnings.

### 7.6 — `AdminLogin` : SweetAlert2 sur Server Component
`swalError` (de `@/lib/swal`) est appelé dans un Server Component contexte potentiel via `signIn`. SweetAlert2 est un library client-only et pourrait crasher lors du SSR.

### 7.7 — ~~`hexstrike.log`~~ indique activité suspecte en cours — CORRIGÉ
Le fichier a été supprimé du disque. Vérifiez l'historique git pour s'assurer qu'il n'y a jamais eu de commit contenant ce fichier.

---

## 8. Recommandations prioritaires

### 🔴 IMMÉDIAT (avant tout déploiement)

1. **Rotater TOUTES les clés locales** : DATABASE_URL, Cloudinary, FedaPay (`sk_live`), AUTH_SECRET, Resend — le fichier `.env.local` existe en clair sur le disque
2. ~~**Supprimer `hexstrike.log`**~~ du disque local (déjà supprimé et gitignore)
3. **Vérifier `getCandidatesRanked()`** — retourne un Query object ou Array selon l'argument (incohérence)
4. ~~**Ajouter rate limiting** sur les endpoints auth et votes~~ ✅
5. **Sécuriser la machine** — `.env.local` est en clair sur le disque : utiliser un gestionnaire de secrets, chiffrer les backups

### 🟠 CETTE SEMAINE

6. **Ajouter validation serveur** — format email, téléphone, nom, slug (regex) — ✅ fait
7. Créer la page `/candidat/dashboard/page.tsx` (ou rediriger vers une page existante)
8. Ajouter une page d'inscription candidat (self-service)
9. Ajouter un flow "mot de passe oublié"
10. Configurer HTTPS et headers de sécurité (CSP, HSTS, X-Frame-Options)
11. **Corriger la vérification signature webhook** — `crypto.timingSafeEqual` ✅
12. Ajouter un timeout sur les appels FedaPay

### 🟡 CE MOIS

13. Centraliser les tokens de couleurs (Tailwind config / CSS variables)
14. Supprimer les blocs de code commentés ou les archiver
15. Ajouter loading states / skeletons
16. Ajouter log d'audit admin
17. Créer sitemap.xml et robots.txt
18. Corriger le message "proof de paiement" sur la page success
19. Ajouter pagination sur la liste des candidats publics
20. Implémenter un cleanup Cloudinary lors de la suppression d'un candidat
21. Mettre à jour le README.md avec la documentation du projet

---

## Annexe : Vue d'ensemble des fichiers critiques

| Fichier | Lignes | Rôle | Problèmes |
|---------|--------|------|-----------|
| `.env.local` | 28 | Config secrets | 🟠 Local uniquement, non dans git — ROTATER les clés |
| `hexstrike.log` | ~~394+~~ | ~~Logs scan sécurité~~ | ✅ Supprimé et gitignore |
| `src/db/schema.ts` | 110 | Schéma DB | 🟡 Types manquants |
| `src/lib/db-queries.ts` | 226 | Requêtes DB | 🔴 Return type incohérent |
| `src/app/api/votes/route.ts` | 182 | API votes | 🟡 80 lignes commentées |
| `src/components/public/Footer.tsx` | 140 | Footer | 🟡 5 SVG inline en dur |
| `src/lib/swal.ts` | 101 | SweetAlert | 🟡 Patterns IA |
| `src/lib/constants.ts` | 14 | Constantes | 🟢 OK |
| `src/middleware.ts` | 38 | Auth middleware | 🟢 OK |
| `src/lib/auth.ts` | 102 | NextAuth config | 🟡 Pas de session expiry |
| `src/components/admin/CandidatForm.tsx` | 280 | Form candidat | 🟡 `form.elements` anti-pattern |
| `src/app/admin/login/page.tsx` | 117 | Login admin | 🟡 Redirection non sécurisée |
| `README.md` | 36 | Documentation | 🟡 Template non personnalisé |
| `AGENTS.md` | 9 | Config AI agent | 🟡 Auto-généré, non pertinent |
| `next.config.ts` | 22 | Next.js config | 🟢 OK |
| `drizzle.config.ts` | 22 | DB config | 🟡 Lit .env.local manuellement |
| `package.json` | 50 | Dépendances | 🟢 OK |

---

*Fin de l'audit.*
