import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";
import { listUtilisateursOptions } from "@/services/utilisateurs";
import type {
  Pipeline,
  PipelineAdmin,
  EtapePipeline,
  OpportuniteListe,
  OpportuniteDetail,
  SuiviOpportunite,
  VuePipeline,
  ColonneEtape,
  TypeEtape,
  TypeSuivi,
  StatutOpportunite,
} from "@/types/opportunite";

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

/**
 * Pipelines créés au premier usage d'une agence. Les étapes ne sont PAS en dur
 * dans le code applicatif : ce ne sont que des VALEURS DE DÉPART, copiées en base
 * la première fois. L'agence les modifie ensuite librement (écran d'admin à venir),
 * sans redéploiement — c'est tout l'intérêt des pipelines configurables (CLAUDE.md).
 */
const PIPELINES_PAR_DEFAUT: {
  nom: string;
  etapes: { nom: string; type: TypeEtape }[];
}[] = [
  {
    nom: "Vente",
    etapes: [
      { nom: "Nouveau", type: "normale" },
      { nom: "Qualifié", type: "normale" },
      { nom: "Visite", type: "normale" },
      { nom: "Offre", type: "normale" },
      { nom: "Négociation", type: "normale" },
      { nom: "Gagné", type: "gain" },
      { nom: "Perdu", type: "perte" },
    ],
  },
  {
    nom: "Location",
    etapes: [
      { nom: "Nouveau", type: "normale" },
      { nom: "Qualifié", type: "normale" },
      { nom: "Visite", type: "normale" },
      { nom: "Dossier", type: "normale" },
      { nom: "Signé", type: "gain" },
      { nom: "Perdu", type: "perte" },
    ],
  },
];

/**
 * Crée les pipelines par défaut pour l'agence si elle n'en a aucun. Idempotent :
 * s'exécute sans effet dès qu'un pipeline existe. RLS : l'insertion est cloisonnée
 * à l'agence courante.
 */
export async function ensurePipelinesParDefaut(
  supabase: SupabaseClient,
  agenceId: string
): Promise<void> {
  const { count } = await supabase
    .from("pipelines")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) return;

  for (let i = 0; i < PIPELINES_PAR_DEFAUT.length; i++) {
    const modele = PIPELINES_PAR_DEFAUT[i];
    const { data: pipeline, error } = await supabase
      .from("pipelines")
      .insert({ agence_id: agenceId, nom: modele.nom, ordre: i })
      .select("id")
      .single();
    if (error || !pipeline) continue;

    const etapes = modele.etapes.map((e, ordre) => ({
      agence_id: agenceId,
      pipeline_id: pipeline.id as string,
      nom: e.nom,
      type: e.type,
      ordre,
    }));
    await supabase.from("etapes_pipeline").insert(etapes);
  }
}

/**
 * Pipelines actifs de l'agence avec leurs étapes ordonnées. Crée les pipelines
 * par défaut au premier appel. RLS : cloisonné automatiquement.
 */
export async function listPipelines(): Promise<Pipeline[]> {
  const supabase = await createClient();

  // agence_courante() donne l'agence effective (source de vérité RLS).
  const { data: agence } = await supabase.rpc("agence_courante");
  if (typeof agence === "string" && agence) {
    await ensurePipelinesParDefaut(supabase, agence);
  }

  const { data: pipelines, error } = await supabase
    .from("pipelines")
    .select("id, nom, ordre")
    .eq("actif", true)
    .order("ordre", { ascending: true });
  if (error) throw new Error(`Lecture des pipelines impossible : ${error.message}`);

  const ids = (pipelines ?? []).map((p) => p.id as string);
  if (ids.length === 0) return [];

  const { data: etapes } = await supabase
    .from("etapes_pipeline")
    .select("id, pipeline_id, nom, ordre, type")
    .in("pipeline_id", ids)
    .order("ordre", { ascending: true });

  const parPipeline = new Map<string, EtapePipeline[]>();
  (etapes ?? []).forEach((e) => {
    const liste = parPipeline.get(e.pipeline_id as string) ?? [];
    liste.push({
      id: e.id as string,
      nom: e.nom as string,
      ordre: (e.ordre as number) ?? 0,
      type: e.type as TypeEtape,
    });
    parPipeline.set(e.pipeline_id as string, liste);
  });

  return (pipelines ?? []).map((p) => ({
    id: p.id as string,
    nom: p.nom as string,
    ordre: (p.ordre as number) ?? 0,
    etapes: parPipeline.get(p.id as string) ?? [],
  }));
}

/**
 * Tous les pipelines de l'agence (y compris désactivés) avec leurs étapes, pour
 * l'écran d'admin. Crée les pipelines par défaut au premier appel. RLS active.
 */
export async function listPipelinesAdmin(): Promise<PipelineAdmin[]> {
  const supabase = await createClient();

  const { data: agence } = await supabase.rpc("agence_courante");
  if (typeof agence === "string" && agence) {
    await ensurePipelinesParDefaut(supabase, agence);
  }

  const { data: pipelines, error } = await supabase
    .from("pipelines")
    .select("id, nom, ordre, actif")
    .order("ordre", { ascending: true });
  if (error) throw new Error(`Lecture des pipelines impossible : ${error.message}`);

  const ids = (pipelines ?? []).map((p) => p.id as string);
  if (ids.length === 0) return [];

  const { data: etapes } = await supabase
    .from("etapes_pipeline")
    .select("id, pipeline_id, nom, ordre, type")
    .in("pipeline_id", ids)
    .order("ordre", { ascending: true });

  const parPipeline = new Map<string, EtapePipeline[]>();
  (etapes ?? []).forEach((e) => {
    const liste = parPipeline.get(e.pipeline_id as string) ?? [];
    liste.push({
      id: e.id as string,
      nom: e.nom as string,
      ordre: (e.ordre as number) ?? 0,
      type: e.type as TypeEtape,
    });
    parPipeline.set(e.pipeline_id as string, liste);
  });

  return (pipelines ?? []).map((p) => ({
    id: p.id as string,
    nom: p.nom as string,
    ordre: (p.ordre as number) ?? 0,
    actif: (p.actif as boolean) ?? true,
    etapes: parPipeline.get(p.id as string) ?? [],
  }));
}

/** Transforme une ligne SQL d'opportunité (avec jointures) en OpportuniteListe. */
function mapOpportuniteListe(o: Record<string, unknown>): OpportuniteListe {
  const bien = premier(
    o.biens as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const contact = premier(
    o.contacts as Record<string, unknown> | Record<string, unknown>[] | null
  );
  return {
    id: o.id as string,
    reference: o.reference as string,
    titre: o.titre as string,
    statut: o.statut as StatutOpportunite,
    montantEstime: (o.montant_estime as number | null) ?? null,
    pipelineId: o.pipeline_id as string,
    etapeId: o.etape_id as string,
    bienReference: (bien?.reference as string | null) ?? null,
    contactNom: (contact?.nom_complet as string | null) ?? null,
    contactTelephone: (contact?.telephone as string | null) ?? null,
  };
}

/**
 * Vue « pipeline » : chaque pipeline avec ses étapes garnies des opportunités
 * OUVERTES (une affaire gagnée/perdue sort du flux). Les colonnes vides sont
 * conservées pour montrer toutes les étapes. Agrégation en mémoire (échelle V1).
 */
export async function getVuesPipeline(): Promise<VuePipeline[]> {
  const supabase = await createClient();
  const pipelines = await listPipelines();
  if (pipelines.length === 0) return [];

  const { data, error } = await supabase
    .from("opportunites")
    .select(
      "id, reference, titre, statut, montant_estime, pipeline_id, etape_id, " +
        "biens(reference), contacts(nom_complet, telephone)"
    )
    .eq("statut", "ouverte")
    .is("supprime_le", null)
    .order("cree_le", { ascending: false });
  if (error) throw new Error(`Lecture des opportunités impossible : ${error.message}`);

  const opportunites = (
    (data ?? []) as unknown as Record<string, unknown>[]
  ).map(mapOpportuniteListe);

  // Regroupement par étape.
  const parEtape = new Map<string, OpportuniteListe[]>();
  for (const opp of opportunites) {
    const liste = parEtape.get(opp.etapeId) ?? [];
    liste.push(opp);
    parEtape.set(opp.etapeId, liste);
  }

  return pipelines.map((pipeline) => {
    const colonnes: ColonneEtape[] = pipeline.etapes.map((etape) => {
      const opps = parEtape.get(etape.id) ?? [];
      const totalEstime = opps.reduce((s, o) => s + (o.montantEstime ?? 0), 0);
      return { etape, opportunites: opps, totalEstime };
    });
    const total = colonnes.reduce((s, c) => s + c.opportunites.length, 0);
    return { pipeline, colonnes, total };
  });
}

/**
 * Fiche détail d'une opportunité : ses liens, toutes les étapes de son pipeline
 * (pour le sélecteur de changement d'étape) et son journal chronologique.
 * Les noms d'utilisateurs (responsable, auteurs du journal) passent par le
 * client admin (la RLS « chacun lit son profil » n'expose pas les collègues).
 * RLS : l'opportunité est cloisonnée à l'agence. Renvoie null si introuvable.
 */
export async function getOpportuniteDetail(
  id: string
): Promise<OpportuniteDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("opportunites")
    .select(
      "id, reference, titre, statut, montant_estime, motif_perte, date_cloture, " +
        "cree_le, pipeline_id, etape_id, responsable_id, " +
        "bien_id, contact_id, demande_id, " +
        "pipelines(nom), etape:etapes_pipeline!etape_id(nom, type), " +
        "biens(reference, titre), contacts(nom_complet, telephone), " +
        "demandes(objectif, statut)"
    )
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (error) throw new Error(`Lecture de l'opportunité impossible : ${error.message}`);
  if (!data) return null;

  const o = data as unknown as Record<string, unknown>;
  const pipeline = premier(o.pipelines as Record<string, unknown> | Record<string, unknown>[] | null);
  const etape = premier(o.etape as Record<string, unknown> | Record<string, unknown>[] | null);
  const bien = premier(o.biens as Record<string, unknown> | Record<string, unknown>[] | null);
  const contact = premier(o.contacts as Record<string, unknown> | Record<string, unknown>[] | null);
  const demande = premier(o.demandes as Record<string, unknown> | Record<string, unknown>[] | null);

  // Toutes les étapes du pipeline (sélecteur de changement d'étape).
  const { data: etapesData } = await supabase
    .from("etapes_pipeline")
    .select("id, nom, ordre, type")
    .eq("pipeline_id", o.pipeline_id as string)
    .order("ordre", { ascending: true });
  const etapes: EtapePipeline[] = (etapesData ?? []).map((e) => ({
    id: e.id as string,
    nom: e.nom as string,
    ordre: (e.ordre as number) ?? 0,
    type: e.type as TypeEtape,
  }));

  // Journal (le plus récent d'abord).
  const { data: journalData } = await supabase
    .from("suivi_opportunites")
    .select("id, type, description, date_evenement, cree_par")
    .eq("opportunite_id", id)
    .order("date_evenement", { ascending: false });

  // Résolution des noms d'utilisateurs (responsable + auteurs du journal).
  const profil = await getUtilisateurConnecte();
  const nomParId = new Map<string, string>();
  if (profil) {
    const utilisateurs = await listUtilisateursOptions(profil.agenceId);
    utilisateurs.forEach((u) => nomParId.set(u.id, u.nomComplet));
  }

  const journal: SuiviOpportunite[] = (journalData ?? []).map((j) => ({
    id: j.id as string,
    type: j.type as TypeSuivi,
    description: j.description as string,
    dateEvenement: j.date_evenement as string,
    auteurNom: j.cree_par ? nomParId.get(j.cree_par as string) ?? null : null,
  }));

  const responsableId = o.responsable_id as string | null;

  return {
    id: o.id as string,
    reference: o.reference as string,
    titre: o.titre as string,
    statut: o.statut as StatutOpportunite,
    montantEstime: (o.montant_estime as number | null) ?? null,
    motifPerte: (o.motif_perte as string | null) ?? null,
    dateCloture: (o.date_cloture as string | null) ?? null,
    creeLe: o.cree_le as string,
    pipelineId: o.pipeline_id as string,
    pipelineNom: (pipeline?.nom as string) ?? "",
    etapeId: o.etape_id as string,
    etapeNom: (etape?.nom as string) ?? "",
    etapeType: (etape?.type as TypeEtape) ?? "normale",
    etapes,
    bienId: (o.bien_id as string | null) ?? null,
    bienReference: (bien?.reference as string | null) ?? null,
    bienTitre: (bien?.titre as string | null) ?? null,
    contactId: (o.contact_id as string | null) ?? null,
    contactNom: (contact?.nom_complet as string | null) ?? null,
    contactTelephone: (contact?.telephone as string | null) ?? null,
    demandeId: (o.demande_id as string | null) ?? null,
    demandeObjectif: (demande?.objectif as string | null) ?? null,
    demandeStatut: (demande?.statut as string | null) ?? null,
    responsableNom: responsableId ? nomParId.get(responsableId) ?? null : null,
    journal,
  };
}
