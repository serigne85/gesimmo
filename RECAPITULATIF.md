# Récapitulatif du projet — gesimmo (M2S IMMO)

> ERP/CRM immobilier pour M2S IMMO, agence à Dakar (vente, location, gérance
> locative). Cœur du produit : **le portefeuille de biens**.
> Document mis à jour le 2026-08-24.

---

## 1. Stack et outillage

| Couche | Choix |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), TypeScript |
| Style | Tailwind CSS v4 |
| Icônes | lucide-react |
| Base de données | PostgreSQL via Supabase (région Europe) |
| Auth | Supabase Auth + RLS |
| Fichiers | Supabase Storage, buckets privés, URLs signées |
| Accès données | supabase-js + SQL (pas d'ORM) |
| Validation | Zod (partagée client/serveur) |
| Hébergement | Vercel (prévu) |
| Dépôt | GitHub `serigne85/gesimmo` |

**Conventions** : base de données en français (`snake_case`, tables au pluriel),
code en anglais (`camelCase`), composants et types en `PascalCase`, routes en
`kebab-case` français. Montants en **FCFA** stockés en `bigint`. Dates en
`timestamptz`, affichage Africa/Dakar.

**Règle d'or** : aucune logique métier dans un composant React — tout dans
`services/`. Fichiers ≤ ~200 lignes. Validation et permissions vérifiées
**côté serveur**.

---

## 2. Architecture des dossiers

```
app/
  (auth)/connexion        écran de connexion (sans sidebar)
  (app)/                  application protégée (layout sidebar + topbar)
    biens/                liste, nouveau, [id] (fiche), [id]/modifier
    utilisateurs/         gestion des comptes (admin)
    + tableau-de-bord, contacts, mandats, opportunites, taches,
      agenda, gestion-locative, paiements, rapports, parametres (coquilles)
components/
  layout/                 AppShell, Sidebar, Topbar, PagePlaceholder
  metier/                 composants du domaine (biens, photos, utilisateurs)
  ui/                     (à venir)
lib/
  supabase/               client, server, admin, proxy, env
  auth/guards.ts          requireRole / requireAdmin (contrôle serveur)
  validation/             schémas Zod (auth, bien, utilisateur)
  utils/                  format.ts (FCFA, dates, tel, WhatsApp), image.ts
  navigation.ts           navigation en donnée
services/                 TOUTE la logique métier + Server Actions
types/                    types métier (bien, contact, photo, roles, utilisateur)
supabase/migrations/      SQL numéroté et versionné
```

---

## 3. Ce qui est réalisé

### Lot 1 — Fondations (terminé, commité)

- **Coquille de l'application** : layout avec sidebar + topbar, navigation
  définie en donnée dans `lib/navigation.ts`, pages placeholder pour tous les
  futurs modules.
- **Authentification Supabase** : connexion, session par cookie, protection des
  routes via `proxy.ts` (l'équivalent du middleware en Next 16). Le rôle `anon`
  ne lit rien ; tout passe par `authenticated`.
- **Gestion des utilisateurs (admin)** : création (via `service_role` côté
  serveur), activation/désactivation, changement de rôle, suppression logique.
  Rôles : `admin`, `direction`, `agent`, `gestionnaire`, `comptable`.
- **Multi-agence** dès la V1 : chaque table métier porte `agence_id`.

### Lot 2 — Biens (en cours)

| Étape | Contenu | Git |
|---|---|---|
| 1 | Schéma (villes/zones, socle contacts, biens), création (référence auto `BN-AAAA-0001`, propriétaire trouvé-ou-créé par téléphone), liste paginée | commité |
| 2 | Fiche détail (`/biens/[id]`), lignes de liste cliquables | commité |
| 3 | Édition (`/biens/[id]/modifier`), formulaire à deux modes création/édition | commité |
| 4 | Transitions de statut (machine à états, validation serveur) | commité |
| 5 | **Photos** (upload compressé, galerie, principale, réordonnancement) | **en local, non commité** |

**Détail des Biens :**

- **Cycle de vie** (statut du bien, distinct d'une étape de négociation) :
  `prospecté → sous_mandat → disponible → sous_offre → vendu | loué`,
  plus `suspendu` et `archivé`. Machine à états dans `services/statuts-bien.ts` :
  transitions autorisées uniquement, filtre vente/location (un bien en vente ne
  peut pas devenir « loué »), `archivé` réversible vers `prospecté`. Changement
  de statut validé côté serveur, présenté en **liste déroulante** sur la fiche.
- **Photos** : bucket Storage **privé**, accès 100 % serveur. Compression à
  1600 px **dans le navigateur** avant envoi (connexion terrain lente). Upload
  par Server Action (autorisation → Storage via `service_role` → ligne
  `photos_bien`). Affichage par **URLs signées** temporaires (1 h), lazy loading.
  Choix de la **photo principale**, **réordonnancement** (flèches), suppression
  physique. Galerie présente sur la fiche détail **et** l'édition. À la création
  d'un bien, on est redirigé vers sa fiche pour ajouter les photos.

---

## 4. Base de données (migrations)

À appliquer manuellement dans l'éditeur SQL du dashboard Supabase.

| Migration | Contenu |
|---|---|
| `0001_agences_utilisateurs.sql` | `agences`, `utilisateurs` (lié 1:1 à `auth.users`, rôle + agence), GRANT + RLS. Instructions pour créer le 1er admin à la main. |
| `0002_zones_contacts_biens.sql` | Fonction `agence_courante()` (SECURITY DEFINER, socle des policies), `villes`/`zones` (référence géo, seed Dakar), `contacts` (téléphone = clé naturelle), `biens`. GRANT + RLS par agence. |
| `0003_photos_bien.sql` | Bucket privé `biens` + table `photos_bien` (chemin, principale, ordre). GRANT + RLS par agence. |

**Décisions structurantes déjà en place :**
- Un seul modèle `contacts` (pas de tables séparées prospects/propriétaires…).
- Suppression **logique** (`supprime_le`) sur contacts, biens (photos : physique).
- Toutes les policies filtrent par `agence_courante()`.

---

## 5. Sécurité

- **RLS PostgreSQL** sur toutes les tables métier, cloisonnée par `agence_id`.
- **GRANT explicites** dans chaque migration (ce projet n'accorde aucun droit de
  table par défaut ; sans GRANT, `permission denied` même pour `service_role`).
- La clé `service_role` ne quitte **jamais** le serveur (`lib/supabase/admin.ts`
  protégé par `import "server-only"`).
- Validation Zod côté serveur obligatoire, même si le client a déjà validé.
- Permissions par rôle vérifiées côté serveur (`lib/auth/guards.ts`).
- Bucket photos privé : le navigateur n'obtient que des URLs signées éphémères.

---

## 6. État Git

- Branche `main`, poussée sur `github.com/serigne85/gesimmo`.
- Dernier commit poussé : `81eb9ac` (édition + transitions de statut).
- **Non commité (en local)** : toute la brique **Photos** (migration `0003`,
  `services/photos.ts`, `services/photos-actions.ts`, `lib/utils/image.ts`,
  `components/metier/GaleriePhotos.tsx`, `TuilePhoto.tsx`, `types/photo.ts`, et
  les ajouts dans les pages biens). L'utilisateur déclenche lui-même les commits.

---

## 7. Reste à faire

**Lot 2 (pour finir)** : documents du bien, import Excel. Puis **contacts**
complets (rôles multiples via `contact_roles`).

**Lots suivants** : mandats (3) · pipelines/opportunités/matching (4) ·
tâches/agenda/visites (5) · baux/échéances/paiements (6) · tableaux de bord (7) ·
notifications/automatisations (8) · tests/audit RLS/déploiement (9).

**Reporté en V2** : comptabilité, facturation, WhatsApp/SMS, portails
propriétaire/locataire, application mobile, publication automatique.
