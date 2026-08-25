import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DemandeListe,
  DemandeDetail,
  DemandeEdition,
  ObjectifDemande,
  StatutDemande,
} from "@/types/demande";
import type { TypeBien } from "@/types/bien";

export const DEMANDES_PAGE_SIZE = 20;

export type DemandesPage = {
  rows: DemandeListe[];
  total: number;
  page: number;
  pageSize: number;
};

/** Filtres optionnels de la liste des demandes (tous cumulables). */
export type FiltresDemandes = {
  objectif?: ObjectifDemande;
  statut?: StatutDemande;
  zoneId?: string;
  type?: TypeBien;
};

/** IDs des demandes liées à une zone donnée (via la table de liaison). */
async function idsParZone(
  supabase: SupabaseClient,
  zoneId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("demande_zones")
    .select("demande_id")
    .eq("zone_id", zoneId);
  return (data ?? []).map((r) => r.demande_id as string);
}

/** IDs des demandes recherchant un type donné (via la table de liaison). */
async function idsParType(
  supabase: SupabaseClient,
  type: TypeBien
): Promise<string[]> {
  const { data } = await supabase
    .from("demande_types")
    .select("demande_id")
    .eq("type", type);
  return (data ?? []).map((r) => r.demande_id as string);
}

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

/**
 * Liste paginée des demandes de l'agence (RLS : cloisonné automatiquement).
 * Le client, les zones ciblées et les types recherchés sont joints en une
 * requête (embeds imbriqués des tables de liaison).
 */
export async function listDemandes(
  page = 1,
  filtres: FiltresDemandes = {}
): Promise<DemandesPage> {
  const supabase = await createClient();
  const from = (page - 1) * DEMANDES_PAGE_SIZE;
  const to = from + DEMANDES_PAGE_SIZE - 1;

  // Filtres zone/type : on résout d'abord l'ensemble des demandes concernées via
  // les tables de liaison, puis on restreint la requête principale par id.
  let idsFiltre: string[] | null = null;
  if (filtres.zoneId) idsFiltre = await idsParZone(supabase, filtres.zoneId);
  if (filtres.type) {
    const parType = await idsParType(supabase, filtres.type);
    idsFiltre = idsFiltre
      ? idsFiltre.filter((id) => parType.includes(id))
      : parType;
  }
  if (idsFiltre !== null && idsFiltre.length === 0) {
    return { rows: [], total: 0, page, pageSize: DEMANDES_PAGE_SIZE };
  }

  let query = supabase
    .from("demandes")
    .select(
      "id, objectif, statut, budget_min, budget_max, nombre_chambres_min, " +
        "surface_min, date_demande, date_echeance, cree_le, " +
        "client:contacts(nom_complet, telephone), " +
        "demande_zones(zones(nom)), " +
        "demande_types(type)",
      { count: "exact" }
    )
    .is("supprime_le", null);

  if (filtres.objectif) query = query.eq("objectif", filtres.objectif);
  if (filtres.statut) query = query.eq("statut", filtres.statut);
  if (idsFiltre !== null) query = query.in("id", idsFiltre);

  // Priorité : échéance la plus proche d'abord (celles sans échéance en dernier),
  // puis les plus récemment saisies.
  const { data, count, error } = await query
    .order("date_echeance", { ascending: true, nullsFirst: false })
    .order("cree_le", { ascending: false })
    .range(from, to);

  if (error) throw new Error(`Lecture des demandes impossible : ${error.message}`);

  const lignes = (data ?? []) as unknown as Record<string, unknown>[];
  const rows: DemandeListe[] = lignes.map((d) => {
    const client = premier(
      d.client as Record<string, unknown> | Record<string, unknown>[] | null
    );

    const zonesLiees = (d.demande_zones as Record<string, unknown>[] | null) ?? [];
    const zones = zonesLiees
      .map((dz) => {
        const zone = premier(
          dz.zones as Record<string, unknown> | Record<string, unknown>[] | null
        );
        return (zone?.nom as string) ?? null;
      })
      .filter((n): n is string => !!n);

    const typesLies = (d.demande_types as Record<string, unknown>[] | null) ?? [];
    const types = typesLies.map((dt) => dt.type as DemandeListe["types"][number]);

    return {
      id: d.id as string,
      clientNom: (client?.nom_complet as string) ?? "",
      clientTelephone: (client?.telephone as string) ?? "",
      objectif: d.objectif as DemandeListe["objectif"],
      statut: d.statut as DemandeListe["statut"],
      budgetMin: (d.budget_min as number | null) ?? null,
      budgetMax: (d.budget_max as number | null) ?? null,
      nombreChambresMin: (d.nombre_chambres_min as number | null) ?? null,
      surfaceMin: (d.surface_min as number | null) ?? null,
      zones,
      types,
      dateDemande: d.date_demande as string,
      dateEcheance: (d.date_echeance as string | null) ?? null,
      creeLe: d.cree_le as string,
    };
  });

  return { rows, total: count ?? 0, page, pageSize: DEMANDES_PAGE_SIZE };
}

/**
 * Fiche détail d'une demande. Renvoie null si elle n'existe pas, est supprimée,
 * ou appartient à une autre agence (masquée par la RLS).
 */
export async function getDemandeById(id: string): Promise<DemandeDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("demandes")
    .select(
      "id, objectif, statut, budget_min, budget_max, nombre_chambres_min, " +
        "surface_min, notes, date_demande, date_echeance, cree_le, " +
        "client:contacts(nom_complet, telephone), " +
        "demande_zones(zone_id, zones(nom)), " +
        "demande_types(type)"
    )
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (error) throw new Error(`Lecture de la demande impossible : ${error.message}`);
  if (!data) return null;

  const d = data as unknown as Record<string, unknown>;
  const client = premier(
    d.client as Record<string, unknown> | Record<string, unknown>[] | null
  );

  const zonesLiees = (d.demande_zones as Record<string, unknown>[] | null) ?? [];
  const zones = zonesLiees
    .map((dz) => {
      const zone = premier(
        dz.zones as Record<string, unknown> | Record<string, unknown>[] | null
      );
      return { id: dz.zone_id as string, nom: (zone?.nom as string) ?? "" };
    })
    .filter((z) => z.nom !== "");

  const typesLies = (d.demande_types as Record<string, unknown>[] | null) ?? [];
  const types = typesLies.map((dt) => dt.type as DemandeDetail["types"][number]);

  return {
    id: d.id as string,
    clientNom: (client?.nom_complet as string) ?? "",
    clientTelephone: (client?.telephone as string) ?? "",
    objectif: d.objectif as DemandeDetail["objectif"],
    statut: d.statut as DemandeDetail["statut"],
    budgetMin: (d.budget_min as number | null) ?? null,
    budgetMax: (d.budget_max as number | null) ?? null,
    nombreChambresMin: (d.nombre_chambres_min as number | null) ?? null,
    surfaceMin: (d.surface_min as number | null) ?? null,
    zones,
    types,
    notes: (d.notes as string | null) ?? null,
    dateDemande: d.date_demande as string,
    dateEcheance: (d.date_echeance as string | null) ?? null,
    creeLe: d.cree_le as string,
  };
}

/**
 * Valeurs brutes d'une demande pour l'édition (ids de zones, pas les libellés).
 * Renvoie null si absente, supprimée, ou hors agence (RLS).
 */
export async function getDemandeEdition(
  id: string
): Promise<DemandeEdition | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("demandes")
    .select(
      "id, objectif, statut, budget_min, budget_max, nombre_chambres_min, " +
        "surface_min, notes, date_demande, date_echeance, " +
        "client:contacts(nom_complet, telephone), " +
        "demande_zones(zone_id), " +
        "demande_types(type)"
    )
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (error) throw new Error(`Lecture de la demande impossible : ${error.message}`);
  if (!data) return null;

  const d = data as unknown as Record<string, unknown>;
  const client = premier(
    d.client as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const zoneIds = ((d.demande_zones as Record<string, unknown>[] | null) ?? []).map(
    (dz) => dz.zone_id as string
  );
  const types = ((d.demande_types as Record<string, unknown>[] | null) ?? []).map(
    (dt) => dt.type as DemandeEdition["types"][number]
  );

  return {
    id: d.id as string,
    clientNom: (client?.nom_complet as string) ?? "",
    clientTelephone: (client?.telephone as string) ?? "",
    objectif: d.objectif as DemandeEdition["objectif"],
    statut: d.statut as DemandeEdition["statut"],
    budgetMin: (d.budget_min as number | null) ?? null,
    budgetMax: (d.budget_max as number | null) ?? null,
    nombreChambresMin: (d.nombre_chambres_min as number | null) ?? null,
    surfaceMin: (d.surface_min as number | null) ?? null,
    zoneIds,
    types,
    dateDemande: d.date_demande as string,
    dateEcheance: (d.date_echeance as string | null) ?? null,
    notes: (d.notes as string | null) ?? null,
  };
}
