/**
 * Rôles de l'application, tels que définis dans CLAUDE.md.
 * Le type `Role` interdit toute faute de frappe : si on écrit ailleurs
 * "gestionaire" au lieu de "gestionnaire", TypeScript refuse de compiler.
 */
export type Role = "admin" | "direction" | "agent" | "gestionnaire" | "comptable";
