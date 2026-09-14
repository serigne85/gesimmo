import { z } from "zod";

/** Texte optionnel : vide → null. */
const texteOptionnel = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => (v ? v : null));

/** Date optionnelle (ISO yyyy-mm-dd) : vide → null. */
const dateOptionnelle = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

/**
 * Édition de l'identité civile d'un contact (pour les contrats). Seul le nom est
 * obligatoire ; naissance et CNI restent optionnels (on les complète au moment
 * de contractualiser). Le téléphone, clé naturelle, n'est pas modifiable ici.
 */
export const identiteContactSchema = z.object({
  nomComplet: z.string().trim().min(2, "Le nom est requis."),
  dateNaissance: dateOptionnelle,
  lieuNaissance: texteOptionnel,
  cni: texteOptionnel,
});

export type IdentiteContactInput = z.infer<typeof identiteContactSchema>;
