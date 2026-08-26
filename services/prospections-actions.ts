"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";
import {
  creerProspectionSchema,
  modifierProspectionSchema,
} from "@/lib/validation/prospection";

export type ProspectionState = { error: string | null; prospectionId?: string };

/** Construit la charge d'insertion/mise à jour commune à partir des données
 *  validées. `date_prospection` est NOT NULL en base (défaut current_date) :
 *  un vide est donc remplacé par la date du jour, jamais inséré à null. */
function chargeProspection(
  d: ReturnType<typeof creerProspectionSchema.parse>
) {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  return {
    date_prospection: d.dateProspection ?? aujourdhui,
    nom_complet: d.nomComplet,
    telephone: d.telephone,
    contact_nom: d.contactNom,
    contact_tel: d.contactTel,
    zone_id: d.zoneId,
    produit: d.produit,
    statut: d.statut,
    date_relance: d.dateRelance,
    observation: d.observation,
    agent_id: d.agentId,
  };
}

/** Lit et valide les champs du formulaire (partagés création/édition). */
function lireFormulaire(formData: FormData) {
  return {
    dateProspection: formData.get("dateProspection") || undefined,
    nomComplet: formData.get("nomComplet"),
    telephone: formData.get("telephone"),
    contactNom: formData.get("contactNom") || undefined,
    contactTel: formData.get("contactTel") || undefined,
    zoneId: formData.get("zoneId") || undefined,
    produit: formData.get("produit") || undefined,
    statut: formData.get("statut") || undefined,
    dateRelance: formData.get("dateRelance") || undefined,
    observation: formData.get("observation") || undefined,
    agentId: formData.get("agentId") || undefined,
  };
}

/**
 * Crée une prospection terrain. Saisie légère : seuls le nom et le téléphone du
 * propriétaire pressenti sont requis. Le responsable (`agent_id`) vaut l'agent
 * choisi, ou par défaut le créateur.
 */
export async function creerProspection(
  _prevState: ProspectionState,
  formData: FormData
): Promise<ProspectionState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = creerProspectionSchema.safeParse(lireFormulaire(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("prospections").insert({
    agence_id: profil.agenceId,
    cree_par: profil.id,
    ...chargeProspection(parsed.data),
    // Responsable par défaut : le créateur, si aucun agent explicite.
    agent_id: parsed.data.agentId ?? profil.id,
  });

  if (error) {
    console.error("creerProspection:", error);
    return { error: "Enregistrement de la prospection impossible." };
  }

  revalidatePath("/prospects");
  redirect("/prospects");
}

/**
 * Modifie une prospection. Cloisonnement par agence assuré par la RLS. L'id est
 * fixé par `.bind()` côté formulaire.
 */
export async function modifierProspection(
  id: string,
  _prevState: ProspectionState,
  formData: FormData
): Promise<ProspectionState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = modifierProspectionSchema.safeParse(lireFormulaire(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prospections")
    .update(chargeProspection(parsed.data))
    .eq("id", id)
    .is("supprime_le", null)
    .select("id");

  if (error) {
    console.error("modifierProspection:", error);
    return { error: "Modification de la prospection impossible." };
  }
  if (!data || data.length === 0) return { error: "Prospection introuvable." };

  revalidatePath("/prospects");
  redirect("/prospects");
}

export type SupprimerProspectionsState = { error: string | null };

/**
 * Suppression LOGIQUE de prospections (marque `supprime_le`), jamais de DELETE
 * physique. Portée : les pilotes (admin/direction) suppriment toute prospection
 * de l'agence ; les autres uniquement les leurs (responsable ou créateur).
 * Contrôle côté serveur — masquer un bouton ne suffit pas.
 */
export async function supprimerProspections(
  ids: string[]
): Promise<SupprimerProspectionsState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };
  if (!Array.isArray(ids) || ids.length === 0) {
    return { error: "Aucune prospection sélectionnée." };
  }

  const supabase = await createClient();
  let query = supabase
    .from("prospections")
    .update({ supprime_le: new Date().toISOString() })
    .in("id", ids)
    .is("supprime_le", null);

  const pilote = profil.role === "admin" || profil.role === "direction";
  if (!pilote) {
    query = query.or(`agent_id.eq.${profil.id},cree_par.eq.${profil.id}`);
  }

  const { error } = await query;
  if (error) {
    console.error("supprimerProspections:", error);
    return { error: "Suppression impossible." };
  }

  revalidatePath("/prospects");
  return { error: null };
}
