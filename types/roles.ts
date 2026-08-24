/**
 * Rôles de l'application, tels que définis dans CLAUDE.md.
 * Le type `Role` interdit toute faute de frappe : si on écrit ailleurs
 * "gestionaire" au lieu de "gestionnaire", TypeScript refuse de compiler.
 */
export type Role = "admin" | "direction" | "agent" | "gestionnaire" | "comptable";

/**
 * Rôle de l'utilisateur actuellement connecté.
 *
 * TODO (lot 1 — étape auth) : remplacer cette valeur simulée par le rôle réel
 * lu dans la session Supabase. C'est le SEUL endroit à modifier : toute la
 * navigation filtrée en dépend, la logique de filtrage restera inchangée.
 */
export const CURRENT_ROLE: Role = "agent";
