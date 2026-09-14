"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";
import { creerOpportuniteSchema } from "@/lib/validation/opportunite";
import {
  TYPES_SUIVI_SAISISSABLES,
  TYPE_SUIVI_LABELS,
  type StatutOpportunite,
  type TypeEtape,
  type TypeSuivi,
} from "@/types/opportunite";

export type CreerOpportuniteState = { error: string | null };
export type OpportuniteActionState = { error: string | null };

/** Statut dérivé du TYPE de l'étape (règle métier, jamais saisi). */
function statutDepuisEtape(type: TypeEtape): StatutOpportunite {
  if (type === "gain") return "gagnee";
  if (type === "perte") return "perdue";
  return "ouverte";
}

/**
 * Crée une opportunité dans un pipeline. Elle démarre automatiquement à la
 * PREMIÈRE étape du pipeline (par ordre) — on ne choisit pas l'étape de départ.
 * Une ligne de journal est écrite pour amorcer la chronologie du suivi.
 * Contrôle d'accès et validation systématiques côté serveur.
 */
export async function creerOpportunite(
  _prevState: CreerOpportuniteState,
  formData: FormData
): Promise<CreerOpportuniteState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = creerOpportuniteSchema.safeParse({
    titre: formData.get("titre"),
    pipelineId: formData.get("pipelineId"),
    bienId: formData.get("bienId") || undefined,
    contactId: formData.get("contactId") || undefined,
    demandeId: formData.get("demandeId") || undefined,
    montantEstime: formData.get("montantEstime") || undefined,
    responsableId: formData.get("responsableId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;

  const supabase = await createClient();

  // Première étape du pipeline choisi (RLS : forcément dans l'agence).
  const { data: etape } = await supabase
    .from("etapes_pipeline")
    .select("id, nom")
    .eq("pipeline_id", d.pipelineId)
    .order("ordre", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!etape) {
    return { error: "Ce pipeline n'a aucune étape. Configurez-le d'abord." };
  }

  // Référence unique OP-AAAA-0001. On réessaie en cas de collision (une référence
  // peut être occupée par une opportunité supprimée, invisible via la RLS).
  const { count } = await supabase
    .from("opportunites")
    .select("id", { count: "exact", head: true });
  const base = (count ?? 0) + 1;
  const annee = new Date().getFullYear();

  let opportuniteId: string | null = null;
  for (let i = 0; i < 6 && !opportuniteId; i++) {
    const reference = `OP-${annee}-${String(base + i).padStart(4, "0")}`;
    const { data, error } = await supabase
      .from("opportunites")
      .insert({
        agence_id: profil.agenceId,
        reference,
        titre: d.titre,
        pipeline_id: d.pipelineId,
        etape_id: etape.id,
        bien_id: d.bienId ?? null,
        contact_id: d.contactId ?? null,
        demande_id: d.demandeId ?? null,
        montant_estime: d.montantEstime,
        responsable_id: d.responsableId ?? profil.id,
        cree_par: profil.id,
      })
      .select("id")
      .single();

    if (!error && data) {
      opportuniteId = data.id as string;
    } else if (error && error.code !== "23505") {
      return { error: "Enregistrement de l'opportunité impossible." };
    }
  }

  if (!opportuniteId) {
    return { error: "Génération de la référence impossible." };
  }

  // Amorce du journal : la chronologie du suivi commence ici.
  await supabase.from("suivi_opportunites").insert({
    agence_id: profil.agenceId,
    opportunite_id: opportuniteId,
    type: "changement_etape",
    description: `Opportunité créée à l'étape « ${etape.nom} ».`,
    etape_id: etape.id,
    cree_par: profil.id,
  });

  revalidatePath("/opportunites");
  redirect("/opportunites");
}

/**
 * Fait avancer une opportunité vers une autre étape de SON pipeline. Le statut
 * (ouverte/gagnee/perdue) est recalculé depuis le TYPE de l'étape cible — jamais
 * saisi. Une étape 'gain' avec une demande liée passe cette demande à
 * « satisfaite » ; une étape 'perte' enregistre le commentaire comme motif. Chaque
 * mouvement laisse une trace au journal. Contrôle d'accès + validation serveur.
 */
export async function changerEtapeOpportunite(
  id: string,
  _prevState: OpportuniteActionState,
  formData: FormData
): Promise<OpportuniteActionState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const etapeId = String(formData.get("etapeId") ?? "");
  const commentaire = String(formData.get("commentaire") ?? "").trim();
  if (!etapeId) return { error: "Étape cible manquante." };

  const supabase = await createClient();

  // Opportunité (RLS : forcément dans l'agence).
  const { data: opp } = await supabase
    .from("opportunites")
    .select("pipeline_id, etape_id, demande_id")
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();
  if (!opp) return { error: "Opportunité introuvable." };

  // Étape cible : doit appartenir au même pipeline.
  const { data: etape } = await supabase
    .from("etapes_pipeline")
    .select("id, nom, type, pipeline_id")
    .eq("id", etapeId)
    .maybeSingle();
  if (!etape || etape.pipeline_id !== opp.pipeline_id) {
    return { error: "Étape cible invalide." };
  }
  if (etape.id === opp.etape_id && !commentaire) {
    return { error: "L'opportunité est déjà à cette étape." };
  }

  const type = etape.type as TypeEtape;
  const nouveauStatut = statutDepuisEtape(type);
  const clot = type === "gain" || type === "perte";

  const { error: majErr } = await supabase
    .from("opportunites")
    .update({
      etape_id: etape.id,
      statut: nouveauStatut,
      date_cloture: clot ? new Date().toISOString() : null,
      motif_perte: type === "perte" ? commentaire || null : null,
      maj_le: new Date().toISOString(),
    })
    .eq("id", id)
    .is("supprime_le", null);
  if (majErr) return { error: "Changement d'étape impossible." };

  // Conclusion gagnée : la demande liée devient satisfaite (si elle existe).
  if (nouveauStatut === "gagnee" && opp.demande_id) {
    await supabase
      .from("demandes")
      .update({ statut: "satisfaite" })
      .eq("id", opp.demande_id as string);
  }

  // Trace au journal.
  const suffixe = commentaire ? ` — ${commentaire}` : "";
  await supabase.from("suivi_opportunites").insert({
    agence_id: profil.agenceId,
    opportunite_id: id,
    type: "changement_etape",
    description: `Passage à l'étape « ${etape.nom} »${suffixe}`,
    etape_id: etape.id,
    cree_par: profil.id,
  });

  revalidatePath("/opportunites");
  revalidatePath(`/opportunites/${id}`);
  return { error: null };
}

/**
 * Ajoute un événement au journal de suivi (note, appel, visite, offre). Écriture
 * append-only : on n'édite ni ne supprime le journal. Contrôle serveur.
 */
export async function ajouterSuiviOpportunite(
  id: string,
  _prevState: OpportuniteActionState,
  formData: FormData
): Promise<OpportuniteActionState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const type = String(formData.get("type") ?? "note") as TypeSuivi;
  const description = String(formData.get("description") ?? "").trim();
  if (!TYPES_SUIVI_SAISISSABLES.includes(type)) {
    return { error: "Type d'événement invalide." };
  }
  if (description.length < 2) {
    return { error: "Décrivez brièvement l'événement." };
  }

  const supabase = await createClient();

  // L'opportunité existe-t-elle dans l'agence ? (RLS)
  const { data: opp } = await supabase
    .from("opportunites")
    .select("id")
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();
  if (!opp) return { error: "Opportunité introuvable." };

  const { error } = await supabase.from("suivi_opportunites").insert({
    agence_id: profil.agenceId,
    opportunite_id: id,
    type,
    description: `${TYPE_SUIVI_LABELS[type]} : ${description}`,
    cree_par: profil.id,
  });
  if (error) return { error: "Enregistrement de l'événement impossible." };

  revalidatePath(`/opportunites/${id}`);
  return { error: null };
}
