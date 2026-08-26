import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  ProspectionListe,
  ProspectionEdition,
  StatutProspection,
} from "@/types/prospection";

export const PROSPECTIONS_PAGE_SIZE = 20;

export type ProspectionsPage = {
  rows: ProspectionListe[];
  total: number;
  page: number;
  pageSize: number;
};

/** Filtres optionnels de la liste des prospections (tous cumulables). */
export type FiltresProspections = {
  statut?: StatutProspection;
  agentId?: string;
  zoneId?: string;
  relancesDues?: boolean; // à relancer avec date_relance <= aujourd'hui
};

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

/**
 * Liste paginée des prospections de l'agence (RLS : cloisonné automatiquement).
 * La zone et l'agent responsable sont joints en une requête. Les prospections
 * supprimées sont exclues au niveau requête (la policy SELECT ne le fait plus,
 * cf. migration 0016).
 */
export async function listProspections(
  page = 1,
  filtres: FiltresProspections = {}
): Promise<ProspectionsPage> {
  const supabase = await createClient();
  const from = (page - 1) * PROSPECTIONS_PAGE_SIZE;
  const to = from + PROSPECTIONS_PAGE_SIZE - 1;

  let query = supabase
    .from("prospections")
    .select(
      "id, date_prospection, nom_complet, telephone, contact_nom, contact_tel, " +
        "produit, statut, date_relance, bien_id, cree_le, " +
        "zones(nom), agent:utilisateurs!agent_id(nom_complet)",
      { count: "exact" }
    )
    .is("supprime_le", null);

  if (filtres.statut) query = query.eq("statut", filtres.statut);
  if (filtres.agentId) query = query.eq("agent_id", filtres.agentId);
  if (filtres.zoneId) query = query.eq("zone_id", filtres.zoneId);
  if (filtres.relancesDues) {
    const aujourdhui = new Date().toISOString().slice(0, 10);
    query = query.eq("statut", "a_relancer").lte("date_relance", aujourdhui);
  }

  // Priorité : relances les plus urgentes d'abord, puis prospection la plus
  // récente.
  const { data, count, error } = await query
    .order("date_relance", { ascending: true, nullsFirst: false })
    .order("date_prospection", { ascending: false })
    .range(from, to);

  if (error)
    throw new Error(`Lecture des prospections impossible : ${error.message}`);

  const lignes = (data ?? []) as unknown as Record<string, unknown>[];
  const rows: ProspectionListe[] = lignes.map((p) => {
    const zone = premier(
      p.zones as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const agent = premier(
      p.agent as Record<string, unknown> | Record<string, unknown>[] | null
    );
    return {
      id: p.id as string,
      dateProspection: p.date_prospection as string,
      nomComplet: p.nom_complet as string,
      telephone: p.telephone as string,
      contactNom: (p.contact_nom as string | null) ?? null,
      contactTel: (p.contact_tel as string | null) ?? null,
      zoneNom: (zone?.nom as string) ?? null,
      produit: (p.produit as string | null) ?? null,
      statut: p.statut as StatutProspection,
      dateRelance: (p.date_relance as string | null) ?? null,
      agentNom: (agent?.nom_complet as string) ?? null,
      bienId: (p.bien_id as string | null) ?? null,
      creeLe: p.cree_le as string,
    };
  });

  return { rows, total: count ?? 0, page, pageSize: PROSPECTIONS_PAGE_SIZE };
}

/**
 * Valeurs brutes d'une prospection, pour pré-remplir le formulaire d'édition
 * ou celui de conversion en bien. Renvoie null si absente, supprimée, ou hors
 * agence (RLS).
 */
export async function getProspectionEdition(
  id: string
): Promise<ProspectionEdition | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("prospections")
    .select(
      "id, date_prospection, nom_complet, telephone, contact_nom, contact_tel, " +
        "zone_id, produit, statut, date_relance, observation, agent_id"
    )
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (error)
    throw new Error(`Lecture de la prospection impossible : ${error.message}`);
  if (!data) return null;

  const p = data as unknown as Record<string, unknown>;
  return {
    id: p.id as string,
    dateProspection: p.date_prospection as string,
    nomComplet: p.nom_complet as string,
    telephone: p.telephone as string,
    contactNom: (p.contact_nom as string | null) ?? null,
    contactTel: (p.contact_tel as string | null) ?? null,
    zoneId: (p.zone_id as string | null) ?? null,
    produit: (p.produit as string | null) ?? null,
    statut: p.statut as StatutProspection,
    dateRelance: (p.date_relance as string | null) ?? null,
    observation: (p.observation as string | null) ?? null,
    agentId: (p.agent_id as string | null) ?? null,
  };
}
