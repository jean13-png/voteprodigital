# Audit Complet — Vote ProDigital

> Date : 19 septembre 2026
> Projet : voteprodigital — Plateforme de vote Bootcamp Digital Academy
> Stack : Next.js 16.3 / React 19 / Drizzle ORM / Neon PostgreSQL / FedaPay / Tailwind CSS v4

---

## Table des matières

1. [Sommaire exécutif](#1-sommaire-exécutif)
2. [Indicateurs de code généré par IA](#2-indicateurs-de-code-généré-par-ia)
3. [Bugs & Problèmes techniques](#3-bugs--problèmes-techniques)
4. [Fonctionnalités manquantes ou mal implémentées](#4-fonctionnalités-manquantes-ou-mal-implémentées)
5. [Bugs production potentiels](#5-bugs-production-potentiels)
6. [Recommandations prioritaires](#6-recommandations-prioritaires)
7. [Annexe : Vue d'ensemble des fichiers critiques](#7-annexe-vue-densemble-des-fichiers-critiques)

---

## 1. Sommaire exécutif

| Catégorie | Gravité | Nombre |
|-----------|---------|--------|
| 🔴 Critique | Critical | 1 |
| 🟠 Haute | High | 9 |
| 🟡 Moyenne | Medium | 26 |
| 🟢 Basse | Low | 6 |

**Verdict global** : Plateforme fonctionnelle avec une bonne base architecturale, mais présentant des failles de sécurité critiques et un état de production non prêt.

> **Corrections appliquées** : Sécurité (logs, HTTPS, CSP, unicité, cascade, email, log sanitization), Loading states admin, SVGs Footer/ShareButton externalisés, Countdown flash corrigé, message success corrigé, messages hardcodés externalisés, validation URL preuve, inscription candidat, mot de passe oublié, Cloudinary cleanup.

---

## 2. Indicateurs de code généré par IA

### 🟡 SIGNIFICATIFS

#### 2.1 — README.md non personnalisé
**Fichier** : `README.md` — contenu identique au template par défaut de `create-next-app` (en-tête "This is a Next.js project bootstrapped with create-next-app"). Aucune mention de Vote ProDigital.

#### 2.2 — AGENTS.md auto-généré par Next.js
**Fichier** : `AGENTS.md` — contient exactement le bloc d'instructions injecté automatiquement par `next dev` (mentionne "next dev" et "generate-agent-files.js"). Ce n'est PAS un fichier de projet.

#### 2.3 — Style de code uniforme suspect
- Toutes les API routes suivent exactement le même pattern : `auth → parse → validate → query → return`
- Toutes les pages admin utilisent exactement la même structure de tableau
- Le composant `CandidatCard` et `VoteForm` utilisent le même pattern de `useState` + `handleSubmit`
- Les noms de variables sont très génériques (`result`, `data`, `err`, `errs`)

#### 2.4 — Commentaires descriptifs inutiles
De nombreux commentaires ne font que décrire ce que le code fait (vs pourquoi) :
```typescript
// Mode manuel DÉSACTIVÉ — uniquement paiement FedaPay en ligne
// MODE MANUEL DÉSACTIVÉ
// Séparer prénom / nom
// Convertir téléphone béninois vers format international
```
Ce pattern de commentaires inline est typique de la génération IA (expliciter chaque étape).

#### 2.5 — Blocs de code commentés en masse
Plusieurs fichiers contiennent des fonctions entières commentées :
- `src/app/api/votes/route.ts` : 80 lignes de code commenté (mode manuel)
- `src/app/(public)/voter/[slug]/page.tsx` : 20 lignes commentées (numéros Mobile Money)
- `VoteForm.tsx` : 15 lignes de code commenté

#### 2.6 — Patterns SweetAlert2 mixin
Le fichier `swal.ts` utilise un pattern de mixin SweetAlert2 avec `customClass` détaillé. C'est un pattern très recommandé par les assistants IA pour la personnalisation de Swal.

#### 2.7 — Couleurs hardcodées répétitives
Les couleurs `#1B2A6B` (bleu) et `#F5A623` (orange) apparaissent dans **chaque composant** en dur. Pas de fichier de design tokens/tokens CSS centralisé.

#### 2.8 — `CandidatForm.tsx` : pattern `form.elements.namedItem`
L'accès aux valeurs du formulaire via `form.elements.namedItem()` (ligne 60-61) est un anti-pattern qui suggère un contournement rapide plutôt qu'une gestion réactive propre (react-hook-form est installé mais utilisé dans VoteForm, pas dans CandidatForm).

### 🟢 MINEURS

#### 2.9 — Import inutilisé
`src/app/candidat/profil/page.tsx` importe `ProfilForm` mais vérifiez son utilisation.

#### 2.10 — `next.config.ts` : `serverActions bodySizeLimit`
La config expérimentale est présente mais Next.js 16 ne nécessite plus ce flag.

---

## 3. Bugs & Problèmes techniques

### 🔴 CRITIQUE

#### 3.1 — `getCandidatesRanked()` retourne un Query object vs Array selon l'argument
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

#### 3.2 — État du toggle non synchronisé
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

#### 3.3 — AdminSidebar : `usePathname` inexact pour les sous-pages
**Fichier** : `src/components/admin/AdminSidebar.tsx:73-74`
```typescript
const active = pathname === item.href ||
    (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
```
Pour `/admin/candidats/nouveau`, le sidebar marque "Candidats" comme actif (correct), mais `/admin/candidats/[id]` ne correspond pas exactement et nécessite le `startsWith` — ça fonctionne, mais c'est fragile.

#### 3.4 — AdminLogin : `signIn` avec `redirect: false` + navigation manuelle
**Fichier** : `src/app/admin/login/page.tsx:23-31`
```typescript
const result = await signIn("admin", { email, password, redirect: false });
if (result?.error) { ... } else { router.push("/admin/dashboard"); }
```
Si `signIn` échoue silencieusement (pas d'erreur mais pas de token), l'utilisateur est redirigée vers le dashboard sans être authentifiée.

### 🟡 MOYENNE

#### 3.5 — `CandidatForm.tsx` : mauvaise gestion du mode "edit" pour mot de passe
En mode edit, si le champ mot de passe est laissé vide (correctement géré), le `password` n'est pas inclus dans le `FormData`, mais le `updateData` dans l'API PUT ne vérifie pas si le mot de passe a changé vs inchangé.

#### 3.6 — `VoteForm.tsx` : `nombreVotes` initial = 1 avec état `number | ""`
L'état `nombreVotes` commence à `1` (number) mais peut devenir `""` (string). Cette union type mal gérée peut causer des problèmes TypeScript en production.

#### 3.7 — `VoterPage` : mode manuel désactivé mais UI toujours présente
La section "Numéros de paiement" (Mobile Money) est commentée dans `VotePage` (lignes 86-106). L'UI ne montre plus ces numéros, mais le texte de la page dit "Effectuez votre paiement Mobile Money". Confusion UX.

#### 3.8 — `/vote/success` : pas de paramètre `voteId` affiché
La page success reçoit `voteId` en `searchParams` mais ne l'affiche pas. L'utilisateur n'a aucune confirmation de référence.

#### 3.9 — `src/app/api/candidat/profil/route.ts` : PUT public
L'endpoint PUT `/api/candidat/profil` n'existe pas dans la page candidat — il n'est lié à aucun formulaire visible. Est-ce un endpoint orphelin ou y a-t-il un formulaire manquant ?

### 🟢 BASSE

#### 3.10 — `CandidatCard.tsx` : `progress` calcule avec `totalVotes` incluant "en_attente"
Le `getCandidatesRanked` filtre par `statut = 'valide'` dans le SQL, donc OK. Mais le `getCandidateBySlug` inclut aussi les votes en attente dans `totalVotes` — ce qui gonfle les compteurs sur la page candidat individuelle.

#### 3.11 — `domainesEnum` et `voteStatutEnum` pas exportés du schéma
Les types sont définis mais pas facilement réutilisables ailleurs.

---

## 4. Fonctionnalités manquantes ou mal implémentées

### 🟠 HAUTE

| # | Fonctionnalité | Impact |
|---|---------------|--------|
| 4.1 | **Dashboard candidat vide** | Les candidats connectés n'ont aucune interface fonctionnelle |
| 4.2 | **Page d'inscription candidat** | Les candidats doivent être créés par un admin uniquement |
| 4.3 | **Mot de passe oublié** | Aucun mécanisme de récupération de compte |
| 4.4 | **Monitoring temps réel des votes** | Pas de WebSocket/polling — le classement est statique (revalidate=60s) |

### 🟡 MOYENNE

| # | Fonctionnalité | Impact |
|---|---------------|--------|
| 4.5 | **Export CSV/PDF admin** | Impossible d'exporter les données de votes |
| 4.6 | **Log d'audit admin** | Aucune traçabilité des actions admin (validation/refus) |
| 4.7 | **Notification email candidate** | Les candidats ne reçoivent aucune notification (seul l'admin est notifié) |
| 4.8 | **Pagination candidates publiques** | La page `/candidats` affiche tous les candidats sans pagination |
| 4.9 | **Sitemap / robots.txt** | Absents — mauvais pour le SEO |
| 4.10 | **Page 401 personnalisée** | En cas de session expirée, pas de redirection vers login |
| 4.11 | **Chargement squelette** | Aucun skeleton/loader sur les pages data-heavy |
| 4.12 | **Accessibilité WCAG** | Pas de vérification ARIA, contraste non testé, focus non géré |
| 4.13 | **Mode sombre** | Non disponible |
| 4.14 | **Gestion des images candidates (suppression Cloudinary)** | La suppression d'un candidat ne nettoie pas Cloudinary |

### 🟢 BASSE

| # | Fonctionnalité | Impact |
|---|---------------|--------|
| 4.15 | **Partage Twitter/X** | Seuls WhatsApp et copie de lien sont disponibles |
| 4.16 | **Statistiques détaillées** | Pas de graphiques dans l'admin (Chart.js/recharts absents) |
| 4.17 | **Backup automatique DB** | Aucun script de sauvegarde |
| 4.18 | **Health check endpoint** | Pas de `/api/health` pour le monitoring |

---

## 5. Bugs production potentiels

### 🟠 HAUTE

#### 5.1 — `drizzle.config.ts` crash en production
Le script `drizzle-kit push` / `drizzle-kit generate` lit `.env.local` qui peut être absent en production.

#### 5.2 — `FedaPay` : timeout non géré
Si FedaPay est lent, l'API votes ne retourne jamais de réponse (pas de timeout). L'utilisateur reste bloqué avec un loading infini.

#### 5.3 — `NEXTAUTH_URL` en localhost
En production avec Vercel, `NEXTAUTH_URL=http://localhost:3000` causera des erreurs de callback URL.

### 🟡 MOYENNE

#### 5.4 — `Countdown.tsx` : timezone locale vs serveur
Le countdown utilise `Date.now()` côté client. Si un votant en France et un en Benin consultent la page, les deux voient le même countdown basé sur leur heure locale — pas UTC.

#### 5.5 — `Image` component : fallback absent
Sur la page candidat (`candidat/[slug]/page.tsx`), la photo peut être `null`. Le fallback affiche la première lettre, mais les composants `Image` de Next.js avec `fill` et pas de `src` valide génèrent des warnings.

#### 5.6 — `AdminLogin` : SweetAlert2 sur Server Component
`swalError` (de `@/lib/swal`) est appelé dans un Server Component contexte potentiel via `signIn`. SweetAlert2 est un library client-only et pourrait crasher lors du SSR.

---

## 6. Recommandations prioritaires

### 🔴 IMMÉDIAT (avant tout déploiement)

1. **Rotater TOUTES les clés locales** : DATABASE_URL, Cloudinary, FedaPay (`sk_live`), AUTH_SECRET, Resend — le fichier `.env.local` existe en clair sur le disque
2. **Vérifier `getCandidatesRanked()`** — retourne un Query object ou Array selon l'argument (incohérence)
3. **Sécuriser la machine** — `.env.local` est en clair sur le disque : utiliser un gestionnaire de secrets, chiffrer les backups

### 🟠 CETTE SEMAINE

4. **Créer la page `/candidat/dashboard/page.tsx`** (ou rediriger vers une page existante)
5. Ajouter une page d'inscription candidat (self-service)
6. Ajouter un flow "mot de passe oublié"
7. Configurer HTTPS et headers de sécurité (CSP, HSTS, X-Frame-Options)
8. Ajouter un timeout sur les appels FedaPay

### 🟡 CE MOIS

9. Centraliser les tokens de couleurs (Tailwind config / CSS variables)
10. Supprimer les blocs de code commentés ou les archiver
11. Ajouter loading states / skeletons
12. Ajouter log d'audit admin
13. Créer sitemap.xml et robots.txt
14. Ajouter pagination sur la liste des candidats publics
15. Mettre à jour le README.md avec la documentation du projet

---

## 7. Annexe : Vue d'ensemble des fichiers critiques

| Fichier | Lignes | Rôle | Problèmes |
|---------|--------|------|-----------|
| `.env.local` | 28 | Config secrets | 🟠 Local uniquement, non dans git — ROTATER les clés |
| `src/db/schema.ts` | 110 | Schéma DB | 🟡 Types manquants |
| `src/lib/db-queries.ts` | 235 | Requêtes DB | 🔴 Return type incohérent (getCandidatesRanked) |
| `src/app/api/votes/route.ts` | 197 | API votes | 🟡 80 lignes commentées, 409 unique vérifié |
| `src/lib/swal.ts` | 101 | SweetAlert | 🟡 Patterns IA |
| `src/components/admin/CandidatForm.tsx` | 280 | Form candidat | 🟡 `form.elements` anti-pattern |
| `src/app/admin/login/page.tsx` | 117 | Login admin | 🟡 Redirection non sécurisée |
| `README.md` | 36 | Documentation | 🟡 Template non personnalisé |
| `AGENTS.md` | 9 | Config AI agent | 🟡 Auto-généré, non pertinent |
| `src/components/public/Footer.tsx` | 137 | Footer | 🟢 SVG externalisés (SocialIcon) |
| `src/components/public/SocialIcon.tsx` | 15 | Composant SVG | 🟢 Nouveau |
| `src/app/admin/loading.tsx` | 16 | Loading admin | 🟢 Nouveau — skeleton |
| `src/app/admin/votes/loading.tsx` | 19 | Loading votes | 🟢 Nouveau — skeleton |
| `src/lib/constants.ts` | 18 | Constantes | 🟢 OK |
| `src/lib/log-error.ts` | 10 | Logger sécurisé | 🟢 Sanitise les erreurs |
| `src/middleware.ts` | ~130 | Auth middleware | 🟢 OK (rate limiting, HSTS, HTTPS) |
| `src/lib/auth.ts` | 109 | NextAuth config | 🟢 OK (session expiry) |
| `src/lib/cloudinary.ts` | 48 | Cloudinary | 🟢 OK (delete ajouté) |
| `next.config.ts` | 31 | Next.js config | 🟢 OK (CSP + headers) |
| `drizzle.config.ts` | 17 | DB config | 🟢 OK (dotenv configuré) |
| `package.json` | 50 | Dépendances | 🟢 OK |

---

*Fin de l'audit.*
