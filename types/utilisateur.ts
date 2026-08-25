import type { Role } from "./roles";

/** Profil applicatif de l'utilisateur connecté (table `utilisateurs`). */
export type UtilisateurProfil = {
  id: string;
  agenceId: string;
  nomComplet: string;
  email: string;
  role: Role;
  actif: boolean;
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
