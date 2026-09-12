import { createClient } from "@/lib/supabase/server";
import type { UtilisateurProfil } from "@/types/utilisateur";

/**
 * Lecture du profil de l'utilisateur connecté (rôle, agence, nom).
 *
 * Fonctions serveur pures (PAS des Server Actions) : appelées depuis des Server
 * Components pour lire des données. Toute la logique d'auth vit ici, jamais dans
 * un composant (CLAUDE.md).
 *
 * La colonne SQL est en français (`nom_complet`), on la traduit en camelCase
 * anglais pour le code (`nomComplet`), conformément aux conventions.
 */
export async function getUtilisateurConnecte(): Promise<UtilisateurProfil | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("utilisateurs")
    .select("id, agence_id, nom_complet, email, role, actif, super_admin")
    .eq("id", user.id)
    .is("supprime_le", null)
    .single();

  if (error || !data) return null;

  // Agence EFFECTIVE = ce que la RLS appliquera. On la lit via la fonction SQL
  // agence_courante() : source unique de vérité, impossible que l'app et la RLS
  // divergent (un écart provoquerait des écritures rejetées). Repli sur l'agence
  // d'origine si l'appel échoue.
  const { data: effective } = await supabase.rpc("agence_courante");
  const agenceId =
    typeof effective === "string" && effective ? effective : data.agence_id;

  return {
    id: data.id,
    agenceId,
    nomComplet: data.nom_complet,
    email: data.email,
    role: data.role,
    actif: data.actif,
    superAdmin: data.super_admin ?? false,
  };
}
