"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";
import {
  creerMiseEnRelationSchema,
  changerStatutSchema,
  ajouterSuiviSchema,
} from "@/lib/validation/mise-en-relation";
import {
  STATUT_MISE_EN_RELATION_LABELS,
  type StatutMiseEnRelation,
} from "@/types/mise-en-relation";

export type MerState = { error: string | null };

/**
 * Crée une mise en relation : on soumet une demande à un partenaire. Après
 * l'insertion, on empile un premier événement dans le journal de suivi. Comme
 * supabase-js n'ouvre pas de transaction multi-requêtes, si le journal échouait,
 * la mise en relation existe déjà et reste exploitable.
 */
export async function creerMiseEnRelation(
  _prevState: MerState,
  formData: FormData
): Promise<MerState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = creerMiseEnRelationSchema.safeParse({
    sens: formData.get("sens") || undefined,
    partenaireId: formData.get("partenaireId"),
    demandeId: formData.get("demandeId") || undefined,
    bienId: formData.get("bienId") || undefined,
    bienPropose: formData.get("bienPropose") || undefined,
    commissionTotale: formData.get("commissionTotale") || undefined,
    partAgence: formData.get("partAgence") || undefined,
    partPartenaire: formData.get("partPartenaire") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const m = parsed.data;
  const supabase = await createClient();

  const { data: mer, error: insErr } = await supabase
    .from("mises_en_relation")
    .insert({
      agence_id: profil.agenceId,
      demande_id: m.demandeId,
      partenaire_id: m.partenaireId,
      sens: m.sens,
      bien_propose: m.bienPropose,
      bien_id: m.bienId,
      commission_totale: m.commissionTotale,
      part_agence: m.partAgence,
      part_partenaire: m.partPartenaire,
      cree_par: profil.id,
    })
    .select("id")
    .single();

  if (insErr || !mer) {
    console.error("creerMiseEnRelation:", insErr);
    return { error: "Enregistrement de la mise en relation impossible." };
  }

  await supabase.from("suivi_mises_en_relation").insert({
    agence_id: profil.agenceId,
    mise_en_relation_id: mer.id,
    type: "changement_statut",
    description: "Mise en relation créée (statut : soumise).",
    cree_par: profil.id,
  });

  revalidatePath("/mises-en-relation");
  if (m.demandeId) revalidatePath(`/demandes/${m.demandeId}`);
  if (m.bienId) revalidatePath(`/biens/${m.bienId}`);
  redirect(`/mises-en-relation/${mer.id}`);
}

/**
 * Ajoute un événement au journal de suivi d'une mise en relation. La RLS garantit
 * qu'on n'écrit que sur une affaire de son agence (l'insert porte l'agence_id de
 * l'utilisateur ; l'affaire elle-même est cloisonnée).
 */
export async function ajouterSuivi(
  miseEnRelationId: string,
  _prevState: MerState,
  formData: FormData
): Promise<MerState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = ajouterSuiviSchema.safeParse({
    type: formData.get("type") || undefined,
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("suivi_mises_en_relation").insert({
    agence_id: profil.agenceId,
    mise_en_relation_id: miseEnRelationId,
    type: parsed.data.type,
    description: parsed.data.description,
    cree_par: profil.id,
  });

  if (error) {
    console.error("ajouterSuivi:", error);
    return { error: "Enregistrement du suivi impossible." };
  }

  revalidatePath(`/mises-en-relation/${miseEnRelationId}`);
  return { error: null };
}

/**
 * Change le statut d'une mise en relation. À la conclusion : on date la
 * conclusion, on enregistre la commission réellement encaissée, et on marque la
 * demande liée comme « satisfaite ». Chaque changement laisse une trace dans le
 * journal. Le recalcul de la demande est ici (règle métier), pas en trigger.
 */
export async function changerStatutMiseEnRelation(
  miseEnRelationId: string,
  _prevState: MerState,
  formData: FormData
): Promise<MerState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = changerStatutSchema.safeParse({
    statut: formData.get("statut"),
    note: formData.get("note") || undefined,
    commissionPercue: formData.get("commissionPercue") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const statut = parsed.data.statut as StatutMiseEnRelation;
  const supabase = await createClient();

  // On relit l'affaire (RLS : cloisonnée) pour connaître la demande liée.
  const { data: mer } = await supabase
    .from("mises_en_relation")
    .select("id, demande_id")
    .eq("id", miseEnRelationId)
    .is("supprime_le", null)
    .maybeSingle();
  if (!mer) return { error: "Mise en relation introuvable." };

  const estConclue = statut === "conclue";
  const { error: majErr } = await supabase
    .from("mises_en_relation")
    .update({
      statut,
      date_conclusion: estConclue ? new Date().toISOString() : null,
      commission_percue: estConclue ? parsed.data.commissionPercue : null,
    })
    .eq("id", miseEnRelationId);

  if (majErr) {
    console.error("changerStatutMiseEnRelation:", majErr);
    return { error: "Changement de statut impossible." };
  }

  // Affaire conclue → la demande client est satisfaite (si une demande existe :
  // en sens entrante, le client vient du partenaire, pas de demande chez nous).
  if (estConclue && mer.demande_id) {
    await supabase
      .from("demandes")
      .update({ statut: "satisfaite" })
      .eq("id", mer.demande_id as string);
  }

  // Trace au journal.
  const note = parsed.data.note ? ` — ${parsed.data.note}` : "";
  await supabase.from("suivi_mises_en_relation").insert({
    agence_id: profil.agenceId,
    mise_en_relation_id: miseEnRelationId,
    type: "changement_statut",
    description: `Statut : ${STATUT_MISE_EN_RELATION_LABELS[statut]}${note}`,
    cree_par: profil.id,
  });

  revalidatePath("/mises-en-relation");
  revalidatePath(`/mises-en-relation/${miseEnRelationId}`);
  return { error: null };
}
