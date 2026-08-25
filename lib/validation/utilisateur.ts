import { z } from "zod";
import { ROLES } from "@/types/roles";

/** Rôle valide (dérivé de la liste unique des rôles). */
export const roleSchema = z.enum(ROLES as [string, ...string[]]);

/** Règle téléphone (même contrainte que les contacts), réutilisée partout. */
export const telephoneUtilisateurSchema = z
  .string()
  .trim()
  .min(6, "Numéro de téléphone invalide.")
  .max(30);

/** Création d'un utilisateur par un admin (mot de passe initial fourni). */
export const creerUtilisateurSchema = z.object({
  nomComplet: z.string().trim().min(2, "Le nom est trop court."),
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide."),
  // Téléphone requis à la création (même règle que les contacts).
  telephone: telephoneUtilisateurSchema,
  role: roleSchema,
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

export type CreerUtilisateurInput = z.infer<typeof creerUtilisateurSchema>;
