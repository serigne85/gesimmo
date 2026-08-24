export type Role = "admin" | "direction" | "agent" | "gestionnaire" | "comptable";

/** Tous les rôles, dans l'ordre d'affichage (utile pour les listes déroulantes). */
export const ROLES: Role[] = [
  "admin",
  "direction",
  "agent",
  "gestionnaire",
  "comptable",
];

/** Libellés affichés dans l'interface (le code reste en anglais, l'UI en français). */
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  direction: "Direction",
  agent: "Agent",
  gestionnaire: "Gestionnaire",
  comptable: "Comptable",
};
