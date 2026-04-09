# Architecture Frontend

## 1. Vue d'ensemble

Le frontend `frontend-academie` est une application Next.js 16 avec App Router.
L'objectif de l'architecture actuelle est de separer clairement :

- la composition de routes dans `src/app`
- l'infrastructure transverse dans `src/core`
- les contrats de domaine partages dans `src/entities`
- la logique metier verticale dans `src/features`

Le projet est organise par responsabilite, pas par type d'ecran uniquement.
Une page Next.js ne doit presque jamais contenir la logique metier ou les appels HTTP.
Elle compose surtout une feature deja structuree.

## 2. Stack et runtime

- Framework : Next.js 16.2.1
- UI : React 19
- Etat global : Redux Toolkit + React Redux
- Langage : TypeScript
- Rendu : App Router avec layouts par groupes de routes
- HTTP : `fetch` via un client maison centralise

Configuration visible :

- `package.json`
  - `npm run dev` lance `next dev --hostname 0.0.0.0 --port 3000`
  - `npm run build` compile l'application
- `next.config.ts`
  - `allowedDevOrigins` autorise `127.0.0.1` et `localhost`
  - `images.remotePatterns` autorise les assets backend en local sur `3001`
  - `reactCompiler: true`

## 3. Carte des dossiers

Structure principale :

```text
src/
  app/
    (marketing)/
    (auth)/
    (student)/
    (teacher)/
    (admin)/
    api/
  core/
    api/
    auth/
    config/
    providers/
    store/
  entities/
  features/
```

Responsabilites :

- `src/app`
  - routes Next.js
  - layouts par zone
  - composition haut niveau uniquement
- `src/core`
  - client HTTP
  - configuration d'environnement
  - bootstrap session
  - providers Redux
  - infrastructure auth
- `src/entities`
  - types transverses de session utilisateur
- `src/features`
  - vraie logique metier
  - clients API par domaine
  - slices Redux
  - pages metier et composants locaux

## 4. Groupes de routes

L'application est decoupee en groupes App Router.

### `(marketing)`

Routes publiques principales :

- `/`
- `/about`
- `/pricing`
- `/formations`
- `/formations/[slug]`
- `/checkout`
- `/contact`
- `/onboarding/*`

Layout :

- `src/app/(marketing)/layout.tsx`

Provider :

- `AuthProviders`

Pourquoi :

- les pages marketing ont parfois besoin de connaitre la session pour adapter la navigation
- elles n'ont pas besoin du store complet student/teacher/admin

### `(auth)`

Routes :

- `/auth`
- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/verify`

Layout :

- `src/app/(auth)/layout.tsx`

Provider :

- `AuthProviders`

### `(student)`

Routes :

- `/student/dashboard`
- `/student/courses`
- `/student/evaluations`
- `/student/calendar`
- `/student/leaderboard`
- `/student/notifications`
- `/student/payments`
- `/student/problems`
- `/student/profile`
- `/student/settings`
- `/student/support`

Layout :

- `src/app/(student)/layout.tsx`

Provider :

- `ApplicationProviders`

Pourquoi :

- l'espace etudiant utilise plusieurs slices Redux en plus de l'auth
- notifications, cours et code editor sont charges dans le store complet

### `(teacher)`

Routes :

- `/teacher/dashboard`
- `/teacher/programs`
- `/teacher/evaluations`
- `/teacher/students`
- `/teacher/calendar`
- `/teacher/settings`

Layout :

- `src/app/(teacher)/layout.tsx`

Provider :

- `ApplicationProviders`

### `(admin)`

Routes :

- `/admin/dashboard`
- `/admin/users`
- `/admin/formations`
- `/admin/payments`
- `/admin/analytics`
- `/admin/support`
- `/admin/audit-logs`
- `/admin/settings`
- `/admin/system-health`

Layout :

- `src/app/(admin)/layout.tsx`

Provider :

- `ApplicationProviders`

## 5. Layout racine et separation des providers

Le layout racine `src/app/layout.tsx` est volontairement minimal :

- pas de store Redux au niveau global
- pas de dependance metier
- seulement la structure HTML et les styles globaux

Cette separation est importante pour les performances :

- les pages marketing et auth utilisent un store auth leger
- les workspaces authentifies utilisent le store complet seulement quand c'est necessaire

Deux providers existent :

### `AuthProviders`

Fichier :

- `src/core/providers/AuthProviders.tsx`

Role :

- cree un store Redux reduit avec seulement `auth`
- hydrate la session initiale lue depuis les cookies
- relance `fetchCurrentSessionThunk()` si une session existe deja

Store associe :

- `src/core/store/auth-store.ts`

### `ApplicationProviders`

Fichier :

- `src/core/providers/ApplicationProviders.tsx`

Role :

- cree le store complet pour les zones student, teacher et admin
- hydrate l'auth au chargement

Store associe :

- `src/core/store/app-store.ts`

Slices actuellement presentes dans le store complet :

- `auth`
- `notificationCenter`
- `studentCodeEditor`
- `studentCourses`

## 6. Session et authentification

Le frontend repose sur une combinaison simple :

- access token garde en memoire
- snapshot utilisateur garde dans des cookies lisibles par Next.js

Fichiers cles :

- `src/core/auth/in-memory-access-token-store.ts`
- `src/core/auth/session-cookie-store.ts`
- `src/core/auth/read-initial-session.ts`

### Comment la session est hydratee

1. Le layout serveur lit les cookies avec `readInitialSession()`.
2. Le layout injecte ce snapshot dans `AuthProviders` ou `ApplicationProviders`.
3. Le provider cree le store Redux avec `createAuthPreloadedState(...)`.
4. Si l'utilisateur etait deja connecte, un refresh est tente cote client.

### Pourquoi conserver des cookies de snapshot

L'App Router a besoin d'un etat accessible cote serveur pour rendre rapidement :

- le role
- le nom
- l'email
- l'avatar
- le statut de verification email

Ces cookies ne remplacent pas le bearer token.
Ils servent surtout a prehydrater l'UI.

## 7. Configuration des appels API

Le coeur de la configuration est dans :

- `src/core/config/application-environment.ts`
- `src/core/api/api-http-client.ts`
- `src/features/auth/api/authenticated-api.client.ts`

### Base URL

La base API suit cette priorite :

1. `NEXT_PUBLIC_API_BASE_URL`
2. `NEXT_PUBLIC_API_URL`
3. en developpement, fallback sur `http://localhost:3001`

Fonctions exposees :

- `buildApiUrl(path)`
- `resolveApiAssetUrl(path)`

`resolveApiAssetUrl` sert a transformer les chemins backend comme `/uploads/...` en URLs complets affichables dans `next/image` ou `<img>`.

### Client HTTP public

`requestApiJson(path, options, fallbackMessage)` fait plusieurs choses :

- ajoute `Content-Type: application/json` sauf en `FormData`
- utilise `cache: "no-store"`
- utilise `credentials: "include"`
- parse automatiquement le JSON ou le texte
- unifie les erreurs dans `ApiClientError`

Consigne de projet :

- les features n'utilisent pas `fetch` directement
- elles passent par ce client commun

### Client HTTP authentifie

`requestAuthenticatedApiJson(...)` ajoute la gestion auth :

- recupere d'abord le bearer token en memoire
- si absent, lance un refresh de session
- ajoute `Authorization: Bearer ...`
- en cas de `401`, relance une tentative via refresh puis rejoue la requete

Cela permet aux features metier de rester concentrees sur :

- l'endpoint
- le payload
- le mapping de la reponse

### Convention de mapping

Chaque client de feature :

- appelle `requestApiJson` ou `requestAuthenticatedApiJson`
- mappe la reponse backend vers un type frontend stable
- nettoie les `null`, nombres et URLs dans le client

Exemples utiles :

- `src/features/course-catalog/course-catalog.client.ts`
- `src/features/payment-checkout/payment-checkout.client.ts`
- `src/features/lesson-view/lesson-view.client.ts`
- `src/features/workspace-data/api/workspace-api.client.ts`
- `src/features/marketing-pages/marketing-pages.client.ts`

## 8. Architecture par domaines

### Auth

Responsabilites :

- login
- register
- refresh session
- reset password
- email verification

Fichiers cles :

- `src/features/auth/api/auth-api.client.ts`
- `src/features/auth/model/auth.slice.ts`
- `src/features/auth/ui/*`

Le slice auth orchestre les thunks et l'etat de session.
Les formulaires restent dans `ui` et deleguent la logique au model.

### Marketing et catalogue

Responsabilites :

- home publique
- pages de marque
- catalogue formations
- detail formation
- contact
- onboarding public

Fichiers cles :

- `src/features/home/*`
- `src/features/marketing-pages/*`
- `src/features/course-catalog/*`
- `src/features/onboarding/*`

### Student workspace

Responsabilites :

- dashboard
- cours souscrits
- lecture de lecon et progression
- evaluations
- support
- leaderboard
- notifications

Fichiers cles :

- `src/features/student-space/*`
- `src/features/student-courses/*`
- `src/features/lesson-view/*`
- `src/features/notification-center/*`
- `src/features/student-code-editor/*`

### Teacher workspace

Responsabilites :

- creation de cours
- modules et lecons video
- evaluations et QCM
- programmes etudiants
- calendrier
- parametres teacher

Une partie importante du CRUD teacher passe par :

- `src/features/workspace-data/api/workspace-api.client.ts`

et des pages teacher qui composent ce client :

- `src/features/teacher-space/pages/*`

### Admin workspace

Responsabilites :

- supervision globale
- utilisateurs
- paiements
- analytics
- support
- audit logs
- settings
- system health

Fichiers cles :

- `src/features/admin-space/admin-space.client.ts`
- `src/features/admin-space/pages/*`

## 9. Flows metier importants

### Inscription et session

1. Le formulaire register appelle `requestRegistrationSession`.
2. Le backend renvoie un access token + profil.
3. Le frontend enregistre le token en memoire.
4. Les cookies de snapshot sont ecrits pour les layouts serveur.
5. L'utilisateur est redirige vers son espace.

### Onboarding et recommandations

1. L'utilisateur remplit les etapes onboarding.
2. Les donnees sont gardees localement pour la reprise.
3. Si l'utilisateur est connecte, elles sont synchronisees via `users/me`.
4. Le backend stocke `onboardingProfile` et `onboardingCompletedAt`.
5. Les recommandations du dashboard exploitent ce profil.

Fichiers cles :

- `src/features/onboarding/OnboardingStepPage.tsx`
- `src/features/users/api/user-profile.client.ts`
- `src/features/student-courses/api/student-courses.service.ts`

### Souscription a une formation

1. Le catalogue charge les cours publics.
2. La page detail expose le CTA vers checkout.
3. Le checkout cree un paiement backend.
4. La confirmation du paiement appelle la route de confirmation.
5. Le backend inscrit l'etudiant au cours.
6. Le cours apparait ensuite dans `/student/courses`.

Fichiers cles :

- `src/features/course-catalog/*`
- `src/features/payment-checkout/*`
- `src/features/student-space/pages/StudentCoursesPage.tsx`

### Lecture d'une lecon

1. L'etudiant ouvre un cours souscrit.
2. `lesson-view.client.ts` charge le detail du cours et la progression.
3. La page affiche la video, le contenu et les ressources.
4. Les mises a jour de progression repartent au backend.

### Teacher CRUD

Le teacher cree ses objets metier depuis les pages :

- cours
- modules
- lecons
- evaluations
- questions
- programmes
- evenements calendrier

Le client principal de cette zone reste :

- `src/features/workspace-data/api/workspace-api.client.ts`

## 10. Comment ajouter un nouvel appel API

Workflow recommande :

1. Identifier la feature responsable.
2. Ajouter ou completer le client dans `feature/api` ou dans le client metier existant.
3. Mapper la reponse backend vers un type frontend stable.
4. Garder la logique d'orchestration dans `feature/model` si l'ecran a du state.
5. Utiliser le client depuis la page/composant.
6. Eviter d'appeler `fetch` directement depuis `app/`.

Checklist :

- public ou authentifie ?
- endpoint stable dans `application-environment.ts` si auth
- type frontend dedie
- gestion d'erreur avec message utilisateur
- mapping des URLs backend via `resolveApiAssetUrl` si besoin

## 11. Comment reconnaitre un element non branche

Dans ce projet, les signaux a surveiller sont :

- formulaire sans `onSubmit`
- bouton en `type="button"` sans action metier
- page qui lit encore un fixture local pour de vraies donnees metier
- composant qui hardcode une valeur deja disponible dans le backend

Derniere correction effectuee dans cette passe :

- la page `/contact` etait encore statique
- elle appelle maintenant `POST /api/contact-requests`
- elle consomme aussi la configuration publique pour l'email support

## 12. Notes d'exploitation

### Variables frontend importantes

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_API_URL`

### Points de debug utiles

- si le frontend charge mais n'affiche pas les images backend, verifier `next.config.ts`
- si HMR bloque entre `localhost` et `127.0.0.1`, verifier `allowedDevOrigins`
- si une page authentifiee perd la session, verifier :
  - le refresh backend
  - les cookies de snapshot
  - le token en memoire

### Point d'attention backend

Le frontend depend de plusieurs tables et endpoints ajoutes pendant les iterations recentes.
Si `DB_SYNCHRONIZE=false`, il faut maintenir les migrations backend en phase, sinon le frontend peut sembler "branche" alors que la persistence manque.

## 13. Resume rapide

Le schema mental le plus utile est le suivant :

- `app/` compose
- `core/` transporte et hydrate
- `features/` implemente le metier
- `entities/` partage les contrats

Et pour les appels API :

- `requestApiJson` pour le public
- `requestAuthenticatedApiJson` pour le prive
- mapping des reponses dans la feature proprietaire
