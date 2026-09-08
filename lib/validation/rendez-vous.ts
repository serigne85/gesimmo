import { z } from "zod";
import {
  TYPES_RENDEZ_VOUS,
  STATUTS_RENDEZ_VOUS,
  NIVEAUX_INTERET,
} from "@/types/rendez-vous";

const texteOptionnel = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const uuidOptionnel = z
  .union([z.string().uuid(), z.literal("")])
  .optional()
  .transform((v) => (v ? v : null));

/** Champs communs d'un rendez-vous (base réutilisée). */
const rdvBase = z.object({
  titre: z.string().trim().min(2, "Le titre est requis."),
  type: z.enum(TYPES_RENDEZ_VOUS as [string, ...string[]]).default("rendez_vous"),
  debut: z.string().trim().min(1, "La date et l'heure de début sont requises."),
  fin: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
  lieu: texteOptionnel(300),
  contactId: uuidOptionnel,
  bienId: uuidOptionnel,
  assigneeId: uuidOptionnel,
  notes: texteOptionnel(),
});

/** Création d'un rendez-vous : titre + début obligatoires. */
export const creerRendezVousSchema = rdvBase;
export type CreerRendezVousInput = z.infer<typeof creerRendezVousSchema>;

/** Édition : mêmes champs, plus le statut. */
export const modifierRendezVousSchema = rdvBase.extend({
  statut: z.enum(STATUTS_RENDEZ_VOUS as [string, ...string[]]),
});
export type ModifierRendezVousInput = z.infer<typeof modifierRendezVousSchema>;

/** Changement de statut rapide. */
export const changerStatutRdvSchema = z.object({
  statut: z.enum(STATUTS_RENDEZ_VOUS as [string, ...string[]]),
});

/** Compte rendu de visite. */
export const compteRenduVisiteSchema = z.object({
  interesse: z
    .union([z.enum(["oui", "non"]), z.literal("")])
    .optional()
    .transform((v) => (v === "oui" ? true : v === "non" ? false : null)),
  niveauInteret: z
    .union([z.enum(NIVEAUX_INTERET as [string, ...string[]]), z.literal("")])
    .optional()
    .transform((v) => (v ? v : null)),
  compteRendu: z.string().trim().min(1, "Le compte rendu est requis.").max(4000),
  suiteADonner: texteOptionnel(),
});
export type CompteRenduVisiteInput = z.infer<typeof compteRenduVisiteSchema>;
