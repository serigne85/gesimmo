import { z } from "zod";
import {
  TYPES_BIEN,
  STATUTS_JURIDIQUES,
  STATUTS_CREATION_BIEN,
} from "@/types/bien";

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
  // Statut initial (défaut prospecte). `dateRelance` n'a de sens que si
  // statut = 'a_relancer' ; l'appairage est validé dans l'action.
  statut: z.enum(STATUTS_CREATION_BIEN as [string, ...string[]]).optional(),
  dateRelance: z.string().trim().optional(),
  titre: z.string().trim().max(150).optional(),
  // Contact secondaire : les deux champs vont de pair (validé dans l'action).
  contactNom: z.string().trim().max(150).optional(),
  contactTelephone: z.string().trim().max(30).optional(),
  adresse: z.string().trim().max(200).optional(),
  nombreChambres: z
    .union([z.coerce.number().int().nonnegative(), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? null : v)),
  surface: z
    .union([z.coerce.number().int().positive(), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? null : v)),
  statutJuridique: z
    .enum(STATUTS_JURIDIQUES as [string, ...string[]])
    .optional(),
  prix: z
    .union([z.coerce.number().int().nonnegative(), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? null : v)),
  description: z.string().trim().max(2000).optional(),
  videoUrl: z.url("Lien vidéo invalide.").max(500).optional(),
});

export type CreerBienInput = z.infer<typeof creerBienSchema>;

/**
 * Édition d'un bien : mêmes champs que la création, sans le propriétaire
 * (le contact est partagé entre biens, il se gère depuis le module Contacts).
 */
export const modifierBienSchema = creerBienSchema.omit({
  proprietaireNom: true,
  proprietaireTelephone: true,
  contactNom: true,
  contactTelephone: true,
  statut: true,
  dateRelance: true,
});

export type ModifierBienInput = z.infer<typeof modifierBienSchema>;
