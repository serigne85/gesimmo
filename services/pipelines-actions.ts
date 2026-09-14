"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";
import { estAdminOuDirection } from "@/types/roles";
import { TYPES_ETAPE, type TypeEtape } from "@/types/opportunite";

export type PipelineActionResult = { error: string | null };
const OK: PipelineActionResult = { error: null };
const REFUS: PipelineActionResult = { error: "Accès refusé." };

/** Contrôle serveur : gestion des pipelines réservée à admin/direction. */
async function gardeAdmin() {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif || !estAdminOuDirection(profil.role)) return null;
  return profil;
}

function rafraichir() {
  revalidatePath("/opportunites/pipelines");
  revalidatePath("/opportunites");
}

/** Crée un pipeline (avec une première étape « Nouveau » pour être utilisable). */
export async function creerPipeline(
  nom: string
): Promise<PipelineActionResult> {
  const profil = await gardeAdmin();
  if (!profil) return REFUS;

  const nomPropre = nom.trim();
  if (nomPropre.length < 2) return { error: "Nom de pipeline trop court." };

  const supabase = await createClient();

  const { data: max } = await supabase
    .from("pipelines")
    .select("ordre")
    .order("ordre", { ascending: false })
    .limit(1)
    .maybeSingle();
  const ordre = ((max?.ordre as number) ?? -1) + 1;

  const { data: pipeline, error } = await supabase
    .from("pipelines")
    .insert({ agence_id: profil.agenceId, nom: nomPropre, ordre })
    .select("id")
    .single();
  if (error || !pipeline) return { error: "Création du pipeline impossible." };

  await supabase.from("etapes_pipeline").insert({
    agence_id: profil.agenceId,
    pipeline_id: pipeline.id as string,
    nom: "Nouveau",
    type: "normale",
    ordre: 0,
  });

  rafraichir();
  return OK;
}

/** Renomme un pipeline. */
export async function renommerPipeline(
  id: string,
  nom: string
): Promise<PipelineActionResult> {
  const profil = await gardeAdmin();
  if (!profil) return REFUS;

  const nomPropre = nom.trim();
  if (nomPropre.length < 2) return { error: "Nom de pipeline trop court." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("pipelines")
    .update({ nom: nomPropre })
    .eq("id", id);
  if (error) return { error: "Renommage impossible." };

  rafraichir();
  return OK;
}

/** Active ou désactive un pipeline (un pipeline inactif n'apparaît plus à la
 *  création d'opportunité, mais les opportunités existantes restent intactes). */
export async function definirActifPipeline(
  id: string,
  actif: boolean
): Promise<PipelineActionResult> {
  const profil = await gardeAdmin();
  if (!profil) return REFUS;

  const supabase = await createClient();
  const { error } = await supabase
    .from("pipelines")
    .update({ actif })
    .eq("id", id);
  if (error) return { error: "Modification impossible." };

  rafraichir();
  return OK;
}

/** Ajoute une étape en fin de pipeline. */
export async function ajouterEtape(
  pipelineId: string,
  nom: string,
  type: TypeEtape
): Promise<PipelineActionResult> {
  const profil = await gardeAdmin();
  if (!profil) return REFUS;

  const nomPropre = nom.trim();
  if (nomPropre.length < 1) return { error: "Nom d'étape requis." };
  if (!TYPES_ETAPE.includes(type)) return { error: "Type d'étape invalide." };

  const supabase = await createClient();
  const { data: max } = await supabase
    .from("etapes_pipeline")
    .select("ordre")
    .eq("pipeline_id", pipelineId)
    .order("ordre", { ascending: false })
    .limit(1)
    .maybeSingle();
  const ordre = ((max?.ordre as number) ?? -1) + 1;

  const { error } = await supabase.from("etapes_pipeline").insert({
    agence_id: profil.agenceId,
    pipeline_id: pipelineId,
    nom: nomPropre,
    type,
    ordre,
  });
  if (error) return { error: "Ajout de l'étape impossible." };

  rafraichir();
  return OK;
}

/** Renomme une étape. */
export async function renommerEtape(
  id: string,
  nom: string
): Promise<PipelineActionResult> {
  const profil = await gardeAdmin();
  if (!profil) return REFUS;

  const nomPropre = nom.trim();
  if (nomPropre.length < 1) return { error: "Nom d'étape requis." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("etapes_pipeline")
    .update({ nom: nomPropre })
    .eq("id", id);
  if (error) return { error: "Renommage impossible." };

  rafraichir();
  return OK;
}

/** Change le type d'une étape (normale / gain / perte). */
export async function changerTypeEtape(
  id: string,
  type: TypeEtape
): Promise<PipelineActionResult> {
  const profil = await gardeAdmin();
  if (!profil) return REFUS;
  if (!TYPES_ETAPE.includes(type)) return { error: "Type d'étape invalide." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("etapes_pipeline")
    .update({ type })
    .eq("id", id);
  if (error) return { error: "Modification impossible." };

  rafraichir();
  return OK;
}

/** Déplace une étape vers le haut ou le bas en échangeant son ordre avec sa
 *  voisine. Sans voisine dans le sens demandé : sans effet. */
export async function deplacerEtape(
  id: string,
  sens: "haut" | "bas"
): Promise<PipelineActionResult> {
  const profil = await gardeAdmin();
  if (!profil) return REFUS;

  const supabase = await createClient();
  const { data: etape } = await supabase
    .from("etapes_pipeline")
    .select("id, pipeline_id, ordre")
    .eq("id", id)
    .maybeSingle();
  if (!etape) return { error: "Étape introuvable." };

  const ordreActuel = etape.ordre as number;
  const query = supabase
    .from("etapes_pipeline")
    .select("id, ordre")
    .eq("pipeline_id", etape.pipeline_id as string);

  const { data: voisine } =
    sens === "haut"
      ? await query
          .lt("ordre", ordreActuel)
          .order("ordre", { ascending: false })
          .limit(1)
          .maybeSingle()
      : await query
          .gt("ordre", ordreActuel)
          .order("ordre", { ascending: true })
          .limit(1)
          .maybeSingle();

  if (!voisine) return OK; // déjà en bout de liste

  // Échange des deux ordres.
  await supabase
    .from("etapes_pipeline")
    .update({ ordre: voisine.ordre as number })
    .eq("id", id);
  await supabase
    .from("etapes_pipeline")
    .update({ ordre: ordreActuel })
    .eq("id", voisine.id as string);

  rafraichir();
  return OK;
}

/** Supprime une étape. Refusé si des opportunités y sont posées, ou si c'est la
 *  dernière étape du pipeline (un pipeline sans étape est inutilisable). */
export async function supprimerEtape(
  id: string
): Promise<PipelineActionResult> {
  const profil = await gardeAdmin();
  if (!profil) return REFUS;

  const supabase = await createClient();

  const { data: etape } = await supabase
    .from("etapes_pipeline")
    .select("pipeline_id")
    .eq("id", id)
    .maybeSingle();
  if (!etape) return { error: "Étape introuvable." };

  const { count: utilisee } = await supabase
    .from("opportunites")
    .select("id", { count: "exact", head: true })
    .eq("etape_id", id)
    .is("supprime_le", null);
  if ((utilisee ?? 0) > 0) {
    return {
      error:
        "Étape utilisée par des opportunités : déplacez-les d'abord vers une autre étape.",
    };
  }

  const { count: nbEtapes } = await supabase
    .from("etapes_pipeline")
    .select("id", { count: "exact", head: true })
    .eq("pipeline_id", etape.pipeline_id as string);
  if ((nbEtapes ?? 0) <= 1) {
    return { error: "Un pipeline doit garder au moins une étape." };
  }

  const { error } = await supabase.from("etapes_pipeline").delete().eq("id", id);
  if (error) return { error: "Suppression impossible." };

  rafraichir();
  return OK;
}
