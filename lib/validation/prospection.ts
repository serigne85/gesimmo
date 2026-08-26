import { z } from "zod";
import { STATUTS_PROSPECTION } from "@/types/prospection";

/** UUID optionnel : "" (select vide) ou absent → null. */
const uuidOptionnel = z
  .union([z.string().uuid(), z.literal("")])
  .optional()
  .transform((v) => (v ? v : null));

/** Texte optionnel : vide → null. */
const texteOptionnel = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v ? v : null));

/** Date optionnelle (ISO yyyy-mm-dd) : vide → null. */
const dateOptionnelle = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

/**
 * Saisie d'une prospection terrain. Obligatoires (saisie légère, comme pour un
 * bien) : le nom et le téléphone du propriétaire pressenti. Tout le reste est
 * optionnel. Règle métier : si le statut est « à relancer », la date de relance
 * devient obligatoire (validée ici, donc côté client ET serveur).
 */
export const creerProspectionSchema = z
  .object({
    dateProspection: dateOptionnelle,
    nomComplet: z.string().trim().min(2, "Le nom est requis."),
    telephone: z.string().trim().min(6, "Numéro de téléphone invalide."),
    contactNom: texteOptionnel,
    contactTel: texteOptionnel,
    zoneId: uuidOptionnel,
    produit: texteOptionnel,
    statut: z.enum(STATUTS_PROSPECTION).default("disponible"),
    dateRelance: dateOptionnelle,
    observation: texteOptionnel,
    agentId: uuidOptionnel,
  })
  .superRefine((val, ctx) => {
    if (val.statut === "a_relancer" && !val.dateRelance) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateRelance"],
        message: "Une date de relance est requise pour ce statut.",
      });
    }
  });

export type CreerProspectionInput = z.infer<typeof creerProspectionSchema>;

/** Édition : mêmes champs et mêmes règles que la création (le nom/téléphone
 *  appartiennent à la prospection, donc modifiables ici). */
export const modifierProspectionSchema = creerProspectionSchema;
export type ModifierProspectionInput = z.infer<typeof modifierProspectionSchema>;
