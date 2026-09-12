import type { Role } from "./roles";

/** Profil applicatif de l'utilisateur connecté (table `utilisateurs`). */
export type UtilisateurProfil = {
  id: string;
  /** Agence EFFECTIVE : l'agence active si super-admin, sinon l'agence d'origine.
   *  C'est celle que la RLS applique — toute écriture est estampillée avec. */
  agenceId: string;
  nomComplet: string;
  email: string;
  role: Role;
  actif: boolean;
  /** Opérateur plateforme : peut basculer entre agences. */
  superAdmin: boolean;
};

/** Une agence proposée dans le sélecteur de bascule (super-admin). */
export type AgenceOption = {
  id: string;
  nom: string;
  ville: string | null;
};

/** Ligne affichée dans la liste de gestion des utilisateurs. */
export type UtilisateurListe = {
  id: string;
  nomComplet: string;
  email: string;
  /** Nullable : les comptes antérieurs à l'ajout de la colonne n'en ont pas. */
  telephone: string | null;
  role: Role;
  actif: boolean;
};
