import { z } from "zod";
import { TYPES_BIEN } from "@/types/bien";

/** Coercition d'un entier optionnel : "" ou absent → null. */
const entierOptionnel = z
  .union([z.coerce.number().int().nonnegative(), z.nan()])
  .optional()
  .transform((v) => (v === undefined || Number.isNaN(v) ? null : v));

/**
 * Création d'une demande client. Obligatoires (saisie légère) : le client
 * (nom + téléphone) et l'objectif. Zones et types sont multiples ; le reste est
 * optionnel. Le montant est un entier de FCFA (jamais de décimale).
 */
export const creerDemandeSchema = z.object({
  clientNom: z.string().trim().min(2, "Le nom du client est requis."),
  clientTelephone: z.string().trim().min(6, "Numéro de téléphone invalide."),
  objectif: z.enum(["achat", "location"]),
  zoneIds: z.array(z.string().uuid()).optional().default([]),
  types: z.array(z.enum(TYPES_BIEN as [string, ...string[]])).optional().default([]),
  budgetMin: entierOptionnel,
  budgetMax: entierOptionnel,
  nombreChambresMin: entierOptionnel,
  surfaceMin: entierOptionnel,
  notes: z.string().trim().max(2000).optional(),
});

export type CreerDemandeInput = z.infer<typeof creerDemandeSchema>;
