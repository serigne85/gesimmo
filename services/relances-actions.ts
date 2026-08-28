"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";

export type RelanceState = { error: string | null };

/**
 * Marque une échéance comme relancée (pose la date du jour). Marqueur léger en
 * attendant le module Tâches (Lot 5), où la relance deviendra une vraie tâche.
 * On ne redirige pas : on revalide le suivi pour rafraîchir la ligne sur place.
 */
export async function marquerRelance(
  echeanceId: string,
  _prevState: RelanceState,
  _formData: FormData
): Promise<RelanceState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("echeances_loyer")
    .update({ derniere_relance_le: new Date().toISOString() })
    .eq("id", echeanceId);

  if (error) return { error: "Enregistrement de la relance impossible." };

  revalidatePath("/paiements");
  return { error: null };
}
