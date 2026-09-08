"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";
import {
  creerTacheSchema,
  modifierTacheSchema,
  changerStatutTacheSchema,
} from "@/lib/validation/tache";

export type TacheState = { error: string | null };

/** Convertit une saisie de date/heure locale (datetime-local) en ISO, ou null. */
function toIso(valeur: string | null): string | null {
  if (!valeur) return null;
  const d = new Date(valeur);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Champs communs lus du formulaire. */
function champs(formData: FormData) {
  return {
    titre: formData.get("titre"),
    description: formData.get("description") || undefined,
    type: formData.get("type") || undefined,
    priorite: formData.get("priorite") || undefined,
    dateEcheance: formData.get("dateEcheance") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
    lienType: formData.get("lienType") || undefined,
    lienId: formData.get("lienId") || undefined,
  };
}

/** Crée une tâche. Le lien (type + id) est optionnel mais doit être cohérent. */
export async function creerTache(
  _prevState: TacheState,
  formData: FormData
): Promise<TacheState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = creerTacheSchema.safeParse(champs(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const t = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("taches").insert({
    agence_id: profil.agenceId,
    titre: t.titre,
    description: t.description,
    type: t.type,
    priorite: t.priorite,
    date_echeance: toIso(t.dateEcheance),
    // Par défaut, la tâche est assignée à son créateur si aucun assigné choisi.
    assignee_id: t.assigneeId ?? profil.id,
    lien_type: t.lienType,
    lien_id: t.lienId,
    cree_par: profil.id,
  });

  if (error) {
    console.error("creerTache:", error);
    return { error: "Enregistrement de la tâche impossible." };
  }

  revalidatePath("/taches");
  redirect("/taches");
}

/** Modifie une tâche (champs + statut). RLS : cloisonnée à l'agence. */
export async function modifierTache(
  id: string,
  _prevState: TacheState,
  formData: FormData
): Promise<TacheState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = modifierTacheSchema.safeParse({
    ...champs(formData),
    statut: formData.get("statut"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const t = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("taches")
    .update({
      titre: t.titre,
      description: t.description,
      type: t.type,
      priorite: t.priorite,
      statut: t.statut,
      date_echeance: toIso(t.dateEcheance),
      assignee_id: t.assigneeId,
      lien_type: t.lienType,
      lien_id: t.lienId,
      // Horodatage d'achèvement synchronisé avec le statut.
      fait_le: t.statut === "faite" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .is("supprime_le", null);

  if (error) {
    console.error("modifierTache:", error);
    return { error: "Modification de la tâche impossible." };
  }

  revalidatePath("/taches");
  revalidatePath(`/taches/${id}`);
  redirect(`/taches/${id}`);
}

/** Change le statut d'une tâche (action rapide depuis la liste). */
export async function changerStatutTache(
  id: string,
  statut: string
): Promise<TacheState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = changerStatutTacheSchema.safeParse({ statut });
  if (!parsed.success) return { error: "Statut invalide." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("taches")
    .update({
      statut: parsed.data.statut,
      fait_le: parsed.data.statut === "faite" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .is("supprime_le", null);

  if (error) {
    console.error("changerStatutTache:", error);
    return { error: "Changement de statut impossible." };
  }

  revalidatePath("/taches");
  revalidatePath(`/taches/${id}`);
  return { error: null };
}

/** Suppression LOGIQUE d'une tâche. Réservée à l'admin (contrôle serveur). */
export async function supprimerTache(id: string): Promise<TacheState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };
  if (profil.role !== "admin") {
    return { error: "Suppression réservée à l'administrateur." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("taches")
    .update({ supprime_le: new Date().toISOString() })
    .eq("id", id)
    .is("supprime_le", null);

  if (error) {
    console.error("supprimerTache:", error);
    return { error: "Suppression impossible." };
  }

  revalidatePath("/taches");
  return { error: null };
}
