# gesimmo — M2S IMMO

ERP/CRM immobilier pour M2S IMMO, agence à Dakar (Sénégal).
Activités de l'agence : vente, location, gérance locative. Pas de promotion neuve.

Le développeur connaît HTML, CSS, PHP, MySQL et JavaScript de base.
Il apprend React et Next.js sur ce projet. **Explique les concepts modernes
quand tu les introduis, en français, sans jargon inutile.**

---

## Priorité produit

Le cœur de l'application est **le portefeuille de biens**, pas le CRM.
Le point de douleur quotidien de l'agence est de savoir ce qu'elle a en stock,
dans quel état, sous quel mandat, depuis combien de temps.

Trois promesses : aucun bien perdu, aucun propriétaire oublié, aucun loyer non tracé.

---

## Stack

| Couche | Choix |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Style | Tailwind CSS |
| Icônes | lucide-react |
| Base de données | PostgreSQL via Supabase (région Europe) |
| Auth | Supabase Auth + RLS |
| Fichiers | Supabase Storage, buckets privés, URLs signées |
| Accès données | supabase-js + SQL. **Pas de Prisma, pas d'ORM.** |
| Hébergement | Vercel |

Ne propose pas d'ajouter une dépendance sans la justifier. Pas de microservices,
pas de state manager global, pas de bibliothèque de composants lourde.

---

## Conventions de nommage — non négociables

| Élément | Convention | Exemple |
|---|---|---|
| Tables et colonnes SQL | `snake_case`, **français**, tables au pluriel | `biens`, `date_prospection` |
| Composants React | `PascalCase` | `CarteBien.tsx` |
| Fonctions et variables | `camelCase`, **anglais** | `getBienById`, `isActive` |
| Types TypeScript | `PascalCase` | `Bien`, `StatutMandat` |
| Routes | `kebab-case`, **français** | `/tableau-de-bord`, `/gestion-locative` |

Base de données en français (elle est lue par l'agence), code en anglais
(conventions JavaScript).

---

## Architecture du code

```
app/
  (auth)/          connexion, mot de passe oublié — sans sidebar
  (app)/           application protégée — layout avec sidebar + topbar
  api/             Route Handlers
components/
  ui/              Button, Input, Badge, Card, Table — génériques
  layout/          Sidebar, Topbar, AppShell
  metier/          CarteBien, BadgeStatut, SelecteurContact
lib/               supabase/, auth/, validation/ (Zod), utils/, navigation.ts
services/          TOUTE la logique métier
types/             types générés Supabase + types métier
supabase/migrations/  fichiers SQL numérotés et versionnés
```

**Règle absolue : aucune logique métier dans un composant React.**
Calcul de retard de loyer, génération de référence, validation de transition
de statut, calcul de commission → dans `services/`. Un composant appelle un
service et affiche le résultat.

Pas de fichier au-delà de ~200 lignes. Pas de duplication. Pas de solution
temporaire non commentée.

---

## Modèle de données — décisions structurantes

**Un seul modèle `contacts`.** Pas de tables séparées prospects / propriétaires /
locataires / acquéreurs. Une personne cumule souvent plusieurs rôles au Sénégal.
Les rôles vivent dans `contact_roles` (contact_id, role, depuis, actif).

**Le téléphone est la clé naturelle.** Unique par agence, avec détection de
doublon à la saisie.

**La visite est un type de rendez-vous**, avec une fiche `comptes_rendus_visite`
rattachée. Pas de module parallèle qui duplique date / heure / agent / statut.

**Les relances sont des `taches`.** Une relance = une tâche de type relance.
Les alertes automatiques (mandat expirant, loyer impayé, bien dormant) créent
aussi des tâches, pour que l'agent n'ait qu'un seul endroit à consulter.

**Pipelines configurables en base** : tables `pipelines` et `etapes_pipeline`.
Jamais de statut de pipeline en dur dans le code. Ajouter un pipeline =
insérer des lignes SQL, zéro développement.

**Statut du bien ≠ étape de négociation.** Le bien suit un cycle de vie unique :
`prospecte → sous_mandat → disponible → sous_offre → vendu | loue`,
plus `suspendu` et `archive`. « Mandat en préparation » est une étape
d'opportunité, pas un état du bien.

**Un seul modèle `mandats`** pour vente, location et gérance : les champs sont
communs à 80 %. Statuts : `brouillon → en_attente_signature → actif → expire | resilie | archive`.

**Paiements partiels** : plusieurs lignes `paiements` rattachées à la même
`echeances_loyer`. Le statut de l'échéance se recalcule, il ne se saisit pas.

**Suppression logique** (`supprime_le`) sur contacts, biens, mandats, baux,
paiements. Jamais de DELETE physique sur ces tables.

**Multi-agence** : toutes les tables métier portent `agence_id`, même s'il n'y
a qu'une agence en V1.

---

## Règles métier locales

- **Montants en FCFA, stockés en `bigint`.** Jamais de `float`, jamais de
  décimal. Le FCFA n'a pas de centimes.
- **`caution_mois` est un nombre de mois de loyer**, pas un montant.
- **Modes de paiement** : espèces, Wave, Orange Money, virement, chèque, dépôt bancaire.
- **Statut juridique du bien** : titre foncier, bail, délibération, acte notarié,
  non titré. Un mandat de vente ne peut pas être créé si le statut juridique
  n'est pas renseigné.
- **Zones en table de référence**, jamais en texte libre — sinon aucun filtre
  ni KPI par zone ne fonctionne.
- **Dates en `timestamptz`**, affichage en Africa/Dakar (UTC+0).

---

## Rôles

`admin`, `direction`, `agent`, `gestionnaire`, `comptable`.

Permission = ressource + action + **portée** (`GLOBALE`, `AGENCE`, `PROPRE`).
Exemple : un agent lit tous les biens de l'agence mais ne modifie que les siens.

Les permissions sont vérifiées **côté serveur**. Masquer un bouton dans l'interface
n'est jamais une sécurité.

---

## Interface

- **Mobile d'abord pour la saisie, ordinateur pour le pilotage.**
- **Saisie d'un bien en 5 champs obligatoires** : type, objectif, ville+zone,
  téléphone, nom du propriétaire. Tout le reste est optionnel et replié.
  Si le formulaire s'alourdit, les agents cessent de saisir.
- Moins de 4 options → boutons. Plus de 4 → liste déroulante.
- Listes en **lignes bordées**, pas en grille de cartes. On pilote un stock,
  on ne séduit pas un acheteur.
- **Une seule action principale par écran.**
- Actions rapides (appeler, WhatsApp) directement dans les lignes de liste.
- Code couleur unique : vert = payé/actif, ambre = en attente, rouge =
  retard/impayé, gris = archivé. Accent bleu profond pour les actions.
- Pas d'émojis dans l'interface. Icônes lucide-react uniquement.
- Pagination systématique, images en lazy loading : la connexion terrain est lente.

---

## Sécurité

- RLS PostgreSQL sur toutes les tables métier, filtrée par `agence_id`.
- La clé `service_role` de Supabase ne quitte **jamais** le serveur.
- Validation Zod partagée client/serveur — la validation serveur est obligatoire
  même si le client a déjà validé.
- Requêtes paramétrées. Jamais de SQL construit par concaténation.
- Photos compressées à 1600 px max **avant** upload.
- `journal_activites` alimenté par triggers PostgreSQL sur les tables sensibles.

---

## Roadmap

| Lot | Contenu | État |
|---|---|---|
| 1 | Projet, auth, utilisateurs, rôles, layout | en cours |
| 2 | Contacts, biens, photos, documents, import Excel | à venir — **mise en production** |
| 3 | Mandats | |
| 4 | Pipelines, opportunités, demandes, matching | |
| 5 | Tâches, agenda, rendez-vous, visites | |
| 6 | Baux, échéances, paiements, reversements | |
| 7 | Tableaux de bord et rapports | |
| 8 | Notifications et automatisations | |
| 9 | Tests, audit RLS, déploiement | |

Reporté en V2 : comptabilité, facturation, WhatsApp/SMS, portails
propriétaire/locataire, application mobile, publication automatique.

---

## Méthode de travail attendue

1. **Une étape à la fois.** N'enchaîne pas plusieurs modules dans une seule
   réponse. Termine, fais vérifier, puis propose la suite.
2. **Explique avant de coder** : objectif, décisions, fichiers concernés.
3. **Donne les commandes exactes** à exécuter, pour Windows / PowerShell.
4. **Termine par une checklist de vérification** et les erreurs probables.
5. Ne modifie pas des fichiers hors du périmètre de l'étape en cours sans le dire.
6. Si une décision de ce fichier te semble mauvaise, **dis-le et argumente** —
   ne l'applique pas en silence et ne la contourne pas non plus.

L'environnement de développement est **Windows / PowerShell**.
