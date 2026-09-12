import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AgenceOption } from "@/types/utilisateur";

/**
 * Agences visibles pour le sélecteur de bascule. Un super-admin les voit toutes
 * (policy RLS 0029) ; un utilisateur ordinaire ne verrait que la sienne. Triées
 * par nom. On n'appelle ceci que pour un super-admin (sinon inutile).
 */
export async function listAgencesPourBascule(): Promise<AgenceOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agences")
    .select("id, nom, ville")
    .is("supprime_le", null)
    .order("nom", { ascending: true });

  if (error) throw new Error(`Lecture des agences impossible : ${error.message}`);

  return (data ?? []).map((a) => ({
    id: a.id as string,
    nom: a.nom as string,
    ville: (a.ville as string | null) ?? null,
  }));
}
