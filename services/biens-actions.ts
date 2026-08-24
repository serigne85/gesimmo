"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";
import { trouverOuCreerContact } from "@/services/contacts";
import { creerBienSchema, modifierBienSchema } from "@/lib/validation/bien";
import { transitionAutorisee } from "@/services/statuts-bien";
import type { StatutBien, ObjectifBien } from "@/types/bien";

export type CreerBienState = { error: string | null };

/**
 * Crée un bien à partir de la saisie rapide.
 * Étapes : contrôle d'accès → validation → trouver/créer le propriétaire →
 * générer une référence unique → insérer.
 * Le statut initial est `prospecte` (défaut en base) : un bien tout juste saisi
 * n'est pas encore sous mandat.
 */
export async function creerBien(
  _prevState: CreerBienState,
  formData: FormData
): Promise<CreerBienState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = creerBienSchema.safeParse({
    type: formData.get("type"),
    objectif: formData.get("objectif"),
    zoneId: formData.get("zoneId"),
    proprietaireNom: formData.get("proprietaireNom"),
    proprietaireTelephone: formData.get("proprietaireTelephone"),
    statutJuridique: formData.get("statutJuridique") || undefined,
    prix: formData.get("prix") || undefined,
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const d = parsed.data;
  const supabase = await createClient();

  // 1. Propriétaire (trouver ou créer par téléphone).
  let proprietaireId: string;
  try {
    proprietaireId = await trouverOuCreerContact(
      supabase,
      profil.agenceId,
      d.proprietaireNom,
      d.proprietaireTelephone
    );
  } catch {
    return { error: "Enregistrement du propriétaire impossible." };
  }

  // 2. Référence unique. On part du nombre de biens existants et on réessaie
  //    en cas de collision (une référence peut être occupée par un bien
  //    supprimé, invisible via la RLS).
  const { count } = await supabase
    .from("biens")
    .select("id", { count: "exact", head: true });
  const base = (count ?? 0) + 1;
  const annee = new Date().getFullYear();

  let insere = false;
  for (let i = 0; i < 6 && !insere; i++) {
    const reference = `BN-${annee}-${String(base + i).padStart(4, "0")}`;
    const { error } = await supabase.from("biens").insert({
      agence_id: profil.agenceId,
      reference,
      type: d.type,
      objectif: d.objectif,
      zone_id: d.zoneId,
      proprietaire_id: proprietaireId,
      statut_juridique: d.statutJuridique ?? null,
      prix: d.prix,
      description: d.description ?? null,
    });

    if (!error) {
      insere = true;
    } else if (error.code !== "23505") {
      // Autre erreur que le doublon de référence : on abandonne.
      return { error: "Enregistrement du bien impossible." };
    }
  }

  if (!insere) return { error: "Génération de la référence impossible." };

  revalidatePath("/biens");
  redirect("/biens");
}

/**
 * Modifie les champs propres d'un bien (pas le propriétaire, pas le statut).
 * L'id est fixé par `.bind()` côté formulaire. La RLS garantit qu'on ne
 * modifie qu'un bien de sa propre agence.
 */
export async function modifierBien(
  id: string,
  _prevState: CreerBienState,
  formData: FormData
): Promise<CreerBienState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = modifierBienSchema.safeParse({
    type: formData.get("type"),
    objectif: formData.get("objectif"),
    zoneId: formData.get("zoneId"),
    statutJuridique: formData.get("statutJuridique") || undefined,
    prix: formData.get("prix") || undefined,
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const d = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("biens")
    .update({
      type: d.type,
      objectif: d.objectif,
      zone_id: d.zoneId,
      statut_juridique: d.statutJuridique ?? null,
      prix: d.prix,
      description: d.description ?? null,
    })
    .eq("id", id)
    .is("supprime_le", null)
    .select("id");

  if (error) return { error: "Modification du bien impossible." };
  if (!data || data.length === 0) return { error: "Bien introuvable." };

  revalidatePath("/biens");
  revalidatePath(`/biens/${id}`);
  redirect(`/biens/${id}`);
}

/**
 * Fait évoluer le statut d'un bien dans son cycle de vie. La transition est
 * validée côté serveur contre la machine à états (masquer un bouton ne suffit
 * pas). L'id est fixé par `.bind()`, la cible arrive du bouton cliqué.
 */
export async function changerStatutBien(
  id: string,
  _prevState: CreerBienState,
  formData: FormData
): Promise<CreerBienState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const cible = formData.get("cible") as StatutBien;
  const supabase = await createClient();

  // Statut actuel + objectif du bien (RLS : forcément dans l'agence).
  const { data: courant } = await supabase
    .from("biens")
    .select("statut, objectif")
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (!courant) return { error: "Bien introuvable." };

  const actuel = courant.statut as StatutBien;
  const objectif = courant.objectif as ObjectifBien;

  if (!transitionAutorisee(actuel, cible, objectif)) {
    return { error: "Transition de statut non autorisée." };
  }

  const { error } = await supabase
    .from("biens")
    .update({ statut: cible })
    .eq("id", id)
    .is("supprime_le", null);

  if (error) return { error: "Changement de statut impossible." };

  revalidatePath("/biens");
  revalidatePath(`/biens/${id}`);
  redirect(`/biens/${id}`);
}
