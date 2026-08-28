import { z } from "zod";
import { MODES_PAIEMENT } from "@/types/bail";

/**
 * Enregistrement d'un reversement au propriétaire. Le mois est au format AAAA-MM
 * (converti en 1er du mois côté action). Montants entiers de FCFA. La cohérence
 * « commission ≤ loyer » est vérifiée dans l'action.
 */
export const creerReversementSchema = z.object({
  periode: z.string().regex(/^\d{4}-\d{2}$/, "Mois invalide."),
  montantLoyer: z.coerce
    .number({ message: "Montant du loyer requis." })
    .int("Le montant doit être un entier de FCFA.")
    .nonnegative("Montant invalide."),
  commission: z
    .union([z.coerce.number().int().nonnegative(), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? 0 : v)),
  dateReversement: z.string().trim().min(1, "Date requise."),
  mode: z.enum(MODES_PAIEMENT as [string, ...string[]]),
  note: z.string().trim().max(500).optional(),
});

export type CreerReversementInput = z.infer<typeof creerReversementSchema>;
