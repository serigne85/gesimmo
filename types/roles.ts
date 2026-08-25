export type Role = "admin" | "direction" | "agent" | "gestionnaire" | "comptable";

/** Tous les rôles, dans l'ordre d'affichage (utile pour les listes déroulantes). */
export const ROLES: Role[] = [
  "admin",
  "direction",
  "agent",
  "gestionnaire",
  "comptable",
];

/** Rôles de pilotage : administration et direction. */
export function estAdminOuDirection(role: Role): boolean {
  return role === "admin" || role === "direction";
}

/**
 * Rôles autorisés à gérer la référence géographique (villes/zones), partagée
 * par toute l'agence. Helper unique, utilisé côté serveur (contrôle d'accès
 * dans les Server Actions) ET côté client (masquer les boutons d'ajout).
 */
export function peutGererReference(role: Role): boolean {
  return estAdminOuDirection(role);
}

/** Rôles autorisés à éditer les modèles de contrat de mandat. */
export function peutGererModeles(role: Role): boolean {
  return estAdminOuDirection(role);
}

/** Libellés affichés dans l'interface (le code reste en anglais, l'UI en français). */
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  direction: "Direction",
  agent: "Agent",
  gestionnaire: "Gestionnaire",
  comptable: "Comptable",
};
