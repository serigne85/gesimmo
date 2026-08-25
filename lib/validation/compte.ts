import { z } from "zod";

/**
 * Changement du mot de passe par l'utilisateur lui-même (libre-service).
 *
 * On demande le mot de passe ACTUEL : l'action serveur le revérifie avant
 * d'appliquer le nouveau. Une session ouverte ne doit pas suffire à changer
 * le mot de passe (poste laissé déverrouillé).
 */
export const changerMotDePasseSchema = z
  .object({
    motDePasseActuel: z.string().min(1, "Le mot de passe actuel est requis."),
    nouveauMotDePasse: z
      .string()
      .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères."),
    confirmation: z.string(),
  })
  .refine((d) => d.nouveauMotDePasse === d.confirmation, {
    message: "Les deux mots de passe ne correspondent pas.",
    path: ["confirmation"],
  })
  .refine((d) => d.nouveauMotDePasse !== d.motDePasseActuel, {
    message: "Le nouveau mot de passe doit être différent de l'actuel.",
    path: ["nouveauMotDePasse"],
  });

export type ChangerMotDePasseInput = z.infer<typeof changerMotDePasseSchema>;
