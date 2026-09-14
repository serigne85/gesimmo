import { z } from "zod";

/**
 * Création d'une opportunité. Obligatoires : un titre (pour la reconnaître) et
 * le pipeline (elle démarrera à sa première étape). Les liens bien / contact /
 * demande sont TOUS optionnels — on peut suivre une affaire avant d'avoir un
 * bien en stock ou un client identifié. Le montant estimé est un entier de FCFA.
 */
export const creerOpportuniteSchema = z.object({
  titre: z.string().trim().min(2, "Le titre est obligatoire."),
  pipelineId: z.string().uuid("Pipeline invalide."),

  bienId: z.string().uuid("Bien invalide.").optional(),
  contactId: z.string().uuid("Contact invalide.").optional(),
  demandeId: z.string().uuid("Demande invalide.").optional(),

  montantEstime: z
    .union([z.coerce.number().int().nonnegative(), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? null : v)),

  responsableId: z.string().uuid("Responsable invalide.").optional(),
});

export type CreerOpportuniteInput = z.infer<typeof creerOpportuniteSchema>;
