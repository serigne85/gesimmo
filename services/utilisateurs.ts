import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UtilisateurListe } from "@/types/utilisateur";

/**
 * Liste les utilisateurs (non supprimés) d'une agence.
 *
 * On passe par le client admin (service_role) : lister TOUS les utilisateurs
 * dépasse la politique RLS « chacun lit son profil ». C'est sûr car cette
 * fonction n'est appelée qu'après un contrôle `requireAdmin()` en amont, et
 * qu'on filtre explicitement sur l'agence de l'admin.
 */
export async function listUtilisateurs(
  agenceId: string
): Promise<UtilisateurListe[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("utilisateurs")
    .select("id, nom_complet, email, role, actif")
    .eq("agence_id", agenceId)
    .is("supprime_le", null)
    .order("nom_complet", { ascending: true });

  if (error) {
    throw new Error(`Lecture des utilisateurs impossible : ${error.message}`);
  }

  return (data ?? []).map((u) => ({
    id: u.id,
    nomComplet: u.nom_complet,
    email: u.email,
    role: u.role,
    actif: u.actif,
  }));
}
