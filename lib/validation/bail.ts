import { z } from "zod";
import { MODES_PAIEMENT } from "@/types/bail";

/**
 * Création d'un bail. Obligatoires : le bien, le locataire (nom + téléphone,
 * trouvé-ou-créé comme pour un propriétaire de bien) et le loyer mensuel — un
 * bail sans loyer n'a pas de sens dans un module de gestion des loyers. Le reste
 * est optionnel. Les montants sont des entiers de FCFA (jamais de décimale).
 */
export const creerBailSchema = z.object({
  bienId: z.string().uuid("Bien invalide."),
  locataireNom: z.string().trim().min(2, "Le nom du locataire est requis."),
  locataireTelephone: z.string().trim().min(6, "Numéro de téléphone invalide."),
  mandatId: z.string().uuid("Mandat invalide.").optional(),

  dateDebut: z.string().trim().optional(),
  dateFin: z.string().trim().optional(),

  loyerMensuel: z.coerce
    .number({ message: "Loyer requis." })
    .int("Le loyer doit être un entier de FCFA.")
    .positive("Le loyer doit être supérieur à zéro."),
  chargesMensuelles: z
    .union([z.coerce.number().int().nonnegative(), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? 0 : v)),
  cautionMois: z
    .union([z.coerce.number().nonnegative(), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? null : v)),
  jourEcheance: z
    .union([z.coerce.number().int().min(1).max(28), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? 1 : v)),
  modePaiement: z.enum(MODES_PAIEMENT as [string, ...string[]]).optional(),

  notes: z.string().trim().max(2000).optional(),
});

export type CreerBailInput = z.infer<typeof creerBailSchema>;
