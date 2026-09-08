import { z } from "zod";
import {
  STATUTS_MISE_EN_RELATION,
  TYPES_SUIVI,
} from "@/types/mise-en-relation";

/** Montant FCFA entier optionnel : "" ou absent → null (jamais de décimale). */
const montantOptionnel = z
  .union([z.coerce.number().int().nonnegative(), z.nan()])
  .optional()
  .transform((v) => (v === undefined || Number.isNaN(v) ? null : v));

/**
 * Création d'une mise en relation. Une demande est soumise à un partenaire
 * (sens 'sortante' par défaut). En sens 'entrante', le produit est un de nos
 * biens (bienId) ; en 'sortante', on décrit le produit du partenaire en clair.
 */
export const creerMiseEnRelationSchema = z
  .object({
    sens: z.enum(["sortante", "entrante"]).default("sortante"),
    partenaireId: z.string().uuid("Partenaire invalide."),
    demandeId: z
      .union([z.string().uuid(), z.literal("")])
      .optional()
      .transform((v) => (v ? v : null)),
    bienId: z
      .union([z.string().uuid(), z.literal("")])
      .optional()
      .transform((v) => (v ? v : null)),
    bienPropose: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((v) => (v ? v : null)),
    commissionTotale: montantOptionnel,
    partAgence: montantOptionnel,
    partPartenaire: montantOptionnel,
  })
  // Cohérence : une sortante cible une demande, une entrante cible un bien.
  .refine((d) => d.sens !== "sortante" || d.demandeId !== null, {
    message: "Une soumission sortante doit être rattachée à une demande.",
    path: ["demandeId"],
  })
  .refine((d) => d.sens !== "entrante" || d.bienId !== null, {
    message: "Une mise en relation entrante doit cibler un bien.",
    path: ["bienId"],
  });

export type CreerMiseEnRelationInput = z.infer<typeof creerMiseEnRelationSchema>;

/** Changement de statut, avec note libre optionnelle (tracée dans le journal). */
export const changerStatutSchema = z.object({
  statut: z.enum(STATUTS_MISE_EN_RELATION as [string, ...string[]]),
  note: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : null)),
  // Renseignée à la conclusion : ce que l'agence a réellement encaissé.
  commissionPercue: montantOptionnel,
});

export type ChangerStatutInput = z.infer<typeof changerStatutSchema>;

/** Ajout d'un événement au journal de suivi. */
export const ajouterSuiviSchema = z.object({
  type: z.enum(TYPES_SUIVI as [string, ...string[]]).default("note"),
  description: z.string().trim().min(1, "La description est requise.").max(2000),
});

export type AjouterSuiviInput = z.infer<typeof ajouterSuiviSchema>;
