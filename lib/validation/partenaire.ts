import { z } from "zod";
import { TYPES_PARTENAIRE } from "@/types/partenaire";

/** Taux de commission (%) optionnel : "" ou absent → null, borné 0–100. */
const tauxOptionnel = z
  .union([z.coerce.number().min(0).max(100), z.nan()])
  .optional()
  .transform((v) => (v === undefined || Number.isNaN(v) ? null : v));

/** Texte optionnel : "" ou absent → null. */
const texteOptionnel = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v ? v : null));

/**
 * Création d'un partenaire. Seul le nom est obligatoire (saisie légère) ; le
 * type a une valeur par défaut. Le reste est optionnel.
 */
export const creerPartenaireSchema = z.object({
  nom: z.string().trim().min(2, "Le nom du partenaire est requis."),
  type: z.enum(TYPES_PARTENAIRE as [string, ...string[]]).default("agence"),
  telephone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => (v ? v : null)),
  email: z
    .union([z.string().trim().email("Adresse e-mail invalide."), z.literal("")])
    .optional()
    .transform((v) => (v ? v : null)),
  tauxCommissionDefaut: tauxOptionnel,
  notes: texteOptionnel,
});

export type CreerPartenaireInput = z.infer<typeof creerPartenaireSchema>;

/** Édition d'un partenaire : mêmes champs, plus l'état actif/inactif. */
export const modifierPartenaireSchema = creerPartenaireSchema.extend({
  actif: z.coerce.boolean().default(true),
});

export type ModifierPartenaireInput = z.infer<typeof modifierPartenaireSchema>;
