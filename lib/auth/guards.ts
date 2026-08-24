import { getUtilisateurConnecte } from "@/services/auth";
import type { UtilisateurProfil } from "@/types/utilisateur";
import type { Role } from "@/types/roles";

/**
 * Vérifie côté serveur que l'utilisateur connecté possède l'un des rôles requis.
 * Lève une erreur sinon. À appeler AU DÉBUT de toute opération sensible.
 * Renvoie le profil pour éviter de le relire ensuite.
 */
export async function requireRole(roles: Role[]): Promise<UtilisateurProfil> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !roles.includes(profil.role)) {
    throw new Error("Accès refusé : privilèges insuffisants.");
  }
  return profil;
}

/** Raccourci : réserve l'action aux administrateurs. */
export async function requireAdmin(): Promise<UtilisateurProfil> {
  return requireRole(["admin"]);
}
