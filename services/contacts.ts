import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Trouve un contact par téléphone dans l'agence, ou le crée s'il n'existe pas.
 * Le téléphone est la clé naturelle (CLAUDE.md) : deux biens du même
 * propriétaire pointent vers le même contact.
 *
 * On reçoit le client Supabase de session (RLS active) : la recherche et la
 * création restent cloisonnées à l'agence de l'utilisateur.
 */
export async function trouverOuCreerContact(
  supabase: SupabaseClient,
  agenceId: string,
  nomComplet: string,
  telephone: string
): Promise<string> {
  const { data: existant } = await supabase
    .from("contacts")
    .select("id")
    .eq("telephone", telephone)
    .is("supprime_le", null)
    .maybeSingle();

  if (existant) return existant.id;

  const { data: cree, error } = await supabase
    .from("contacts")
    .insert({ agence_id: agenceId, nom_complet: nomComplet, telephone })
    .select("id")
    .single();

  if (error) {
    // Course entre deux créations simultanées : le doublon a été inséré
    // entre-temps, on relit et on renvoie l'existant.
    if (error.code === "23505") {
      const { data: retrouve } = await supabase
        .from("contacts")
        .select("id")
        .eq("telephone", telephone)
        .is("supprime_le", null)
        .single();
      if (retrouve) return retrouve.id;
    }
    throw new Error(`Création du contact impossible : ${error.message}`);
  }

  return cree.id;
}
