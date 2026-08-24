import { z } from "zod";
import { TYPES_BIEN, STATUTS_JURIDIQUES } from "@/types/bien";

/**
 * Création d'un bien. Les 5 premiers champs sont obligatoires (saisie rapide) ;
 * le reste est optionnel. Le montant est un entier de FCFA (jamais de décimale).
 */
export const creerBienSchema = z.object({
  // --- Obligatoires ---
  type: z.enum(TYPES_BIEN as [string, ...string[]]),
  objectif: z.enum(["vente", "location"]),
  zoneId: z.string().uuid("Zone invalide."),
  proprietaireNom: z.string().trim().min(2, "Le nom du propriétaire est requis."),
  proprietaireTelephone: z
    .string()
    .trim()
    .min(6, "Numéro de téléphone invalide."),

  // --- Optionnels ---
  statutJuridique: z
    .enum(STATUTS_JURIDIQUES as [string, ...string[]])
    .optional(),
  prix: z
    .union([z.coerce.number().int().nonnegative(), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? null : v)),
  description: z.string().trim().max(2000).optional(),
});

export type CreerBienInput = z.infer<typeof creerBienSchema>;

/**
 * Édition d'un bien : mêmes champs que la création, sans le propriétaire
 * (le contact est partagé entre biens, il se gère depuis le module Contacts).
 */
export const modifierBienSchema = creerBienSchema.omit({
  proprietaireNom: true,
  proprietaireTelephone: true,
});

export type ModifierBienInput = z.infer<typeof modifierBienSchema>;
