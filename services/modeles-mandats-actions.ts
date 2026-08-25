"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";
import { peutGererModeles } from "@/types/roles";
import { TYPES_MANDAT, type TypeMandat } from "@/types/mandat";

export type ModeleState = { error: string | null; ok?: boolean };

/**
 * Enregistre (crée ou met à jour) le modèle de contrat d'une nature de mandat.
 * Réservé admin/direction — contrôle serveur, la vraie barrière. L'upsert
 * s'appuie sur la contrainte unique (agence_id, type) ; la RLS garantit qu'on
 * n'écrit que pour sa propre agence.
 */
export async function enregistrerModeleMandat(
  type: TypeMandat,
  titre: string,
  corps: string
): Promise<ModeleState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };
  if (!peutGererModeles(profil.role)) {
    return { error: "Édition réservée aux rôles admin et direction." };
  }
  if (!TYPES_MANDAT.includes(type)) return { error: "Nature invalide." };

  const t = titre.trim();
  if (t.length < 2) return { error: "Le titre du modèle est requis." };

  const supabase = await createClient();
  const { error } = await supabase.from("modeles_mandats").upsert(
    {
      agence_id: profil.agenceId,
      type,
      titre: t,
      corps,
      maj_le: new Date().toISOString(),
    },
    { onConflict: "agence_id,type" }
  );

  if (error) return { error: "Enregistrement du modèle impossible." };

  revalidatePath("/mandats/modeles");
  return { error: null, ok: true };
}
