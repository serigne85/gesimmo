import { z } from "zod";

/**
 * Schéma de connexion, partagé client/serveur (CLAUDE.md).
 * Le serveur revalide TOUJOURS, même si le client a déjà validé.
 */
export const connexionSchema = z.object({
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

export type ConnexionInput = z.infer<typeof connexionSchema>;
