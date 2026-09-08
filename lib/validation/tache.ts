import { z } from "zod";
import {
  TYPES_TACHE,
  PRIORITES_TACHE,
  STATUTS_TACHE,
} from "@/types/tache";

const LIENS_TACHE = [
  "bien",
  "contact",
  "mandat",
  "demande",
  "bail",
  "partenaire",
  "mise_en_relation",
] as const;

/** Champs communs d'une tâche (base réutilisée en création et en édition). */
const tacheBase = z.object({
  titre: z.string().trim().min(2, "Le titre est requis."),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : null)),
  type: z.enum(TYPES_TACHE as [string, ...string[]]).default("autre"),
  priorite: z.enum(PRIORITES_TACHE as [string, ...string[]]).default("normale"),
  dateEcheance: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
  assigneeId: z
    .union([z.string().uuid(), z.literal("")])
    .optional()
    .transform((v) => (v ? v : null)),
  lienType: z
    .union([z.enum(LIENS_TACHE), z.literal("")])
    .optional()
    .transform((v) => (v ? v : null)),
  lienId: z
    .union([z.string().uuid(), z.literal("")])
    .optional()
    .transform((v) => (v ? v : null)),
});

/** Le rattachement doit préciser type ET élément, ou aucun des deux. */
const lienCoherent = (d: { lienType: unknown; lienId: unknown }) =>
  (d.lienType === null) === (d.lienId === null);
const lienMessage = {
  message: "Le rattachement doit préciser à la fois le type et l'élément.",
  path: ["lienId"] as string[],
};

/** Création d'une tâche : seul le titre est obligatoire (saisie légère). */
export const creerTacheSchema = tacheBase.refine(lienCoherent, lienMessage);
export type CreerTacheInput = z.infer<typeof creerTacheSchema>;

/** Édition d'une tâche : mêmes champs, plus le statut. */
export const modifierTacheSchema = tacheBase
  .extend({ statut: z.enum(STATUTS_TACHE as [string, ...string[]]) })
  .refine(lienCoherent, lienMessage);
export type ModifierTacheInput = z.infer<typeof modifierTacheSchema>;

/** Changement de statut d'une tâche (action rapide). */
export const changerStatutTacheSchema = z.object({
  statut: z.enum(STATUTS_TACHE as [string, ...string[]]),
});
export type ChangerStatutTacheInput = z.infer<typeof changerStatutTacheSchema>;
