"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getUtilisateurConnecte } from "@/services/auth";
import type { ZoneOption } from "@/services/reference";
import { peutGererReference } from "@/types/roles";

export type VilleResult = {
  error: string | null;
  ville?: { id: string; nom: string };
};
export type ZoneResult = { error: string | null; zone?: ZoneOption };

/**
 * Crée une ville de référence (ou renvoie l'existante si le nom existe déjà :
 * création idempotente, plus douce à l'usage).
 *
 * villes/zones sont une référence GLOBALE (pas d'agence_id) : seul service_role
 * peut y insérer — `authenticated` n'a que le SELECT (voir migration 0002). On
 * agit donc via le client admin, APRÈS avoir vérifié que l'appelant est connecté
 * et actif. Le vocabulaire géographique est ainsi partagé par toute l'agence.
 */
export async function creerVille(nomBrut: string): Promise<VilleResult> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };
  if (!peutGererReference(profil.role)) {
    return { error: "Création réservée aux rôles admin et direction." };
  }

  const nom = nomBrut.trim();
  if (nom.length < 2 || nom.length > 80) {
    return { error: "Nom de ville invalide (2 à 80 caractères)." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("villes")
    .insert({ nom })
    .select("id, nom")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: exist } = await admin
        .from("villes")
        .select("id, nom")
        .eq("nom", nom)
        .single();
      if (exist) return { error: null, ville: exist };
    }
    return { error: "Création de la ville impossible." };
  }
  return { error: null, ville: data };
}

/**
 * Crée une zone rattachée à une ville (ou renvoie l'existante si le couple
 * ville+nom existe déjà). Mêmes règles d'accès que creerVille.
 */
export async function creerZone(
  villeId: string,
  nomBrut: string
): Promise<ZoneResult> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };
  if (!peutGererReference(profil.role)) {
    return { error: "Création réservée aux rôles admin et direction." };
  }

  if (!villeId) return { error: "Choisissez d'abord une ville." };
  const nom = nomBrut.trim();
  if (nom.length < 2 || nom.length > 80) {
    return { error: "Nom de zone invalide (2 à 80 caractères)." };
  }

  const admin = createAdminClient();
  const colonnes = "id, nom, ville_id, villes(nom)";
  const { data, error } = await admin
    .from("zones")
    .insert({ ville_id: villeId, nom })
    .select(colonnes)
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: exist } = await admin
        .from("zones")
        .select(colonnes)
        .eq("ville_id", villeId)
        .eq("nom", nom)
        .single();
      if (exist) return { error: null, zone: versZoneOption(exist) };
    }
    return { error: "Création de la zone impossible." };
  }
  return { error: null, zone: versZoneOption(data) };
}

/** Convertit une ligne `zones` (avec la ville jointe) en ZoneOption. */
function versZoneOption(row: unknown): ZoneOption {
  const z = row as Record<string, unknown>;
  const ville = z.villes as { nom?: string } | { nom?: string }[] | null;
  const villeNom = Array.isArray(ville) ? ville[0]?.nom : ville?.nom;
  return {
    id: z.id as string,
    nom: z.nom as string,
    villeId: z.ville_id as string,
    villeNom: villeNom ?? "",
  };
}
