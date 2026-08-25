import { z } from "zod";
import { TYPES_MANDAT, COMMISSION_UNITES } from "@/types/mandat";

/**
 * Création d'un mandat. Seuls le bien et la nature sont obligatoires : un mandat
 * peut naître en brouillon incomplet, puis se compléter. La règle « un mandat de
 * vente exige le statut juridique du bien » est vérifiée dans l'action (elle
 * dépend du bien, pas du seul formulaire).
 */
export const creerMandatSchema = z.object({
  bienId: z.string().uuid("Bien invalide."),
  type: z.enum(TYPES_MANDAT as [string, ...string[]]),
  exclusif: z.boolean().optional().default(false),
  dateDebut: z.string().trim().optional(),
  dateFin: z.string().trim().optional(),
  commissionValeur: z
    .union([z.coerce.number().nonnegative(), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? null : v)),
  commissionUnite: z.enum(COMMISSION_UNITES as [string, ...string[]]).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type CreerMandatInput = z.infer<typeof creerMandatSchema>;
