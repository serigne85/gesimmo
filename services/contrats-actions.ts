"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";

export type ContratState = { error: string | null; success: boolean };

/** Rôles autorisés à rédiger un contrat de mandat. */
const ROLES_CONTRAT = ["admin", "direction", "agent", "gestionnaire"] as const;

/**
 * Enregistre le texte (retouché) du contrat d'un mandat. Contrôle serveur du
 * rôle ; la RLS cloisonne déjà par agence. L'id est fixé par `.bind()`.
 */
export async function enregistrerContratMandat(
  id: string,
  _prevState: ContratState,
  formData: FormData
): Promise<ContratState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif || !ROLES_CONTRAT.includes(profil.role as never)) {
    return { error: "Accès refusé.", success: false };
  }

  const texte = String(formData.get("contratTexte") ?? "").trim();
  if (!texte) return { error: "Le contrat est vide.", success: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mandats")
    .update({ contrat_texte: texte, contrat_maj_le: new Date().toISOString() })
    .eq("id", id)
    .is("supprime_le", null)
    .select("id");

  if (error) return { error: "Enregistrement du contrat impossible.", success: false };
  if (!data || data.length === 0) return { error: "Mandat introuvable.", success: false };

  revalidatePath(`/mandats/${id}/contrat`);
  revalidatePath(`/mandats/${id}/contrat/imprimer`);
  return { error: null, success: true };
}
