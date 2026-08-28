import { z } from "zod";
import { MODES_PAIEMENT } from "@/types/bail";

/**
 * Enregistrement d'un paiement. Le montant est un entier de FCFA strictement
 * positif (jamais de décimale). Le mode est obligatoire ; référence et note sont
 * optionnelles.
 */
export const creerPaiementSchema = z.object({
  montant: z.coerce
    .number({ message: "Montant requis." })
    .int("Le montant doit être un entier de FCFA.")
    .positive("Le montant doit être supérieur à zéro."),
  datePaiement: z.string().trim().min(1, "Date requise."),
  mode: z.enum(MODES_PAIEMENT as [string, ...string[]]),
  referenceTransaction: z.string().trim().max(100).optional(),
  note: z.string().trim().max(500).optional(),
});

export type CreerPaiementInput = z.infer<typeof creerPaiementSchema>;
