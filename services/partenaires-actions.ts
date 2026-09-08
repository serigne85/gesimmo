"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";
import {
  creerPartenaireSchema,
  modifierPartenaireSchema,
} from "@/lib/validation/partenaire";

export type PartenaireState = { error: string | null };

/**
 * Crée un partenaire (agence confrère, courtier…). Contrôle d'accès → validation
 * → insertion. La RLS et l'`agence_id` cloisonnent à l'agence de l'utilisateur.
 */
export async function creerPartenaire(
  _prevState: PartenaireState,
  formData: FormData
): Promise<PartenaireState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = creerPartenaireSchema.safeParse({
    nom: formData.get("nom"),
    type: formData.get("type") || undefined,
    telephone: formData.get("telephone") || undefined,
    email: formData.get("email") || undefined,
    tauxCommissionDefaut: formData.get("tauxCommissionDefaut") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const p = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("partenaires").insert({
    agence_id: profil.agenceId,
    nom: p.nom,
    type: p.type,
    telephone: p.telephone,
    email: p.email,
    taux_commission_defaut: p.tauxCommissionDefaut,
    notes: p.notes,
    cree_par: profil.id,
  });

  if (error) {
    console.error("creerPartenaire:", error);
    return { error: "Enregistrement du partenaire impossible." };
  }

  revalidatePath("/partenaires");
  redirect("/partenaires");
}

/**
 * Modifie un partenaire (y compris son état actif/inactif). La propriété est
 * garantie par la RLS (policy partenaires_update, cloisonnée par agence).
 */
export async function modifierPartenaire(
  id: string,
  _prevState: PartenaireState,
  formData: FormData
): Promise<PartenaireState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = modifierPartenaireSchema.safeParse({
    nom: formData.get("nom"),
    type: formData.get("type") || undefined,
    telephone: formData.get("telephone") || undefined,
    email: formData.get("email") || undefined,
    tauxCommissionDefaut: formData.get("tauxCommissionDefaut") || undefined,
    notes: formData.get("notes") || undefined,
    actif: formData.get("actif") ?? false,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const p = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("partenaires")
    .update({
      nom: p.nom,
      type: p.type,
      telephone: p.telephone,
      email: p.email,
      taux_commission_defaut: p.tauxCommissionDefaut,
      notes: p.notes,
      actif: p.actif,
    })
    .eq("id", id)
    .is("supprime_le", null);

  if (error) {
    console.error("modifierPartenaire:", error);
    return { error: "Modification du partenaire impossible." };
  }

  revalidatePath("/partenaires");
  revalidatePath(`/partenaires/${id}`);
  redirect(`/partenaires/${id}`);
}

/**
 * Suppression LOGIQUE d'un partenaire (marque `supprime_le`), jamais de DELETE
 * physique : des mises en relation historiques y font référence. Réservée à
 * l'admin (contrôle serveur, la vraie barrière).
 */
export async function supprimerPartenaire(
  id: string
): Promise<PartenaireState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };
  if (profil.role !== "admin") {
    return { error: "Suppression réservée à l'administrateur." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("partenaires")
    .update({ supprime_le: new Date().toISOString() })
    .eq("id", id)
    .is("supprime_le", null);

  if (error) {
    console.error("supprimerPartenaire:", error);
    return { error: "Suppression impossible." };
  }

  revalidatePath("/partenaires");
  return { error: null };
}
