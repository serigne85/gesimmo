import type { Role } from "./roles";

/** Profil applicatif de l'utilisateur connecté (table `utilisateurs`). */
export type UtilisateurProfil = {
  id: string;
  agenceId: string;
  nomComplet: string;
  email: string;
  role: Role;
};
