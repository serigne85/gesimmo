import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getUrlsPhotosPrincipales } from "@/services/photos";
import type {
  BienListe,
  BienDetail,
  BienEdition,
  TypeBien,
  StatutBien,
  ObjectifBien,
} from "@/types/bien";

export const BIENS_PAGE_SIZE = 20;

export type BiensPage = {
  rows: BienListe[];
  total: number;
  page: number;
  pageSize: number;
};

/** Filtres optionnels de la liste des biens (tous cumulables). */
export type FiltresBiens = {
  zoneId?: string;
  type?: TypeBien;
  statut?: StatutBien;
  objectif?: ObjectifBien;
};

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

/**
 * Liste paginée des biens de l'agence (RLS : cloisonné automatiquement).
 * Les libellés de zone/ville et le propriétaire sont joints en une requête.
 */
export async function listBiens(
  page = 1,
  filtres: FiltresBiens = {}
): Promise<BiensPage> {
  const supabase = await createClient();
  const from = (page - 1) * BIENS_PAGE_SIZE;
  const to = from + BIENS_PAGE_SIZE - 1;

  let query = supabase
    .from("biens")
    .select(
      "id, reference, titre, type, objectif, statut, prix, zone_id, " +
        "zones(nom, villes(nom)), " +
        // Deux FK vers contacts (propriétaire + contact) : on désambiguïse par
        // la colonne de clé étrangère (hint PostgREST `!proprietaire_id`).
        "proprietaire:contacts!proprietaire_id(nom_complet, telephone)",
      { count: "exact" }
    )
    .is("supprime_le", null);

  // Filtres cumulables : on n'applique que ceux qui sont renseignés.
  if (filtres.zoneId) query = query.eq("zone_id", filtres.zoneId);
  if (filtres.type) query = query.eq("type", filtres.type);
  if (filtres.statut) query = query.eq("statut", filtres.statut);
  if (filtres.objectif) query = query.eq("objectif", filtres.objectif);

  const { data, count, error } = await query
    .order("cree_le", { ascending: false })
    .range(from, to);

  if (error) throw new Error(`Lecture des biens impossible : ${error.message}`);

  // Sans types Supabase générés, la jointure est mal inférée : on caste en type
  // souple avant de mapper vers le type fort BienListe.
  const lignes = (data ?? []) as unknown as Record<string, unknown>[];

  // Vignettes : une seule requête pour toutes les photos principales de la page.
  const photos = await getUrlsPhotosPrincipales(lignes.map((b) => b.id as string));

  const rows: BienListe[] = lignes.map((b) => {
    const zone = premier(b.zones as Record<string, unknown> | Record<string, unknown>[] | null);
    const ville = zone ? premier(zone.villes as Record<string, unknown> | Record<string, unknown>[] | null) : null;
    const proprio = premier(b.proprietaire as Record<string, unknown> | Record<string, unknown>[] | null);

    return {
      id: b.id as string,
      reference: b.reference as string,
      titre: (b.titre as string | null) ?? null,
      type: b.type as BienListe["type"],
      objectif: b.objectif as BienListe["objectif"],
      statut: b.statut as BienListe["statut"],
      prix: (b.prix as number | null) ?? null,
      zoneNom: (zone?.nom as string) ?? null,
      villeNom: (ville?.nom as string) ?? null,
      proprietaireNom: (proprio?.nom_complet as string) ?? "",
      proprietaireTelephone: (proprio?.telephone as string) ?? "",
      photoPrincipaleUrl: photos.get(b.id as string) ?? null,
    };
  });

  return { rows, total: count ?? 0, page, pageSize: BIENS_PAGE_SIZE };
}

/**
 * Fiche détail d'un bien par son id. Renvoie null si le bien n'existe pas,
 * est supprimé, ou appartient à une autre agence (masqué par la RLS).
 */
export async function getBienById(id: string): Promise<BienDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("biens")
    .select(
      "id, reference, titre, type, objectif, statut, zone_id, date_relance, statut_juridique, prix, " +
        "description, video_url, adresse, nombre_chambres, surface_m2, cree_le, " +
        "zones(nom, villes(nom)), " +
        "proprietaire:contacts!proprietaire_id(nom_complet, telephone), " +
        "contact:contacts!contact_id(nom_complet, telephone)"
    )
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (error) throw new Error(`Lecture du bien impossible : ${error.message}`);
  if (!data) return null;

  const b = data as unknown as Record<string, unknown>;
  const zone = premier(b.zones as Record<string, unknown> | Record<string, unknown>[] | null);
  const ville = zone ? premier(zone.villes as Record<string, unknown> | Record<string, unknown>[] | null) : null;
  const proprio = premier(b.proprietaire as Record<string, unknown> | Record<string, unknown>[] | null);
  const contact = premier(b.contact as Record<string, unknown> | Record<string, unknown>[] | null);

  return {
    id: b.id as string,
    reference: b.reference as string,
    titre: (b.titre as string | null) ?? null,
    type: b.type as BienDetail["type"],
    objectif: b.objectif as BienDetail["objectif"],
    statut: b.statut as BienDetail["statut"],
    zoneId: (b.zone_id as string | null) ?? null,
    dateRelance: (b.date_relance as string | null) ?? null,
    statutJuridique: (b.statut_juridique as BienDetail["statutJuridique"]) ?? null,
    prix: (b.prix as number | null) ?? null,
    description: (b.description as string | null) ?? null,
    videoUrl: (b.video_url as string | null) ?? null,
    adresse: (b.adresse as string | null) ?? null,
    nombreChambres: (b.nombre_chambres as number | null) ?? null,
    surface: (b.surface_m2 as number | null) ?? null,
    zoneNom: (zone?.nom as string) ?? null,
    villeNom: (ville?.nom as string) ?? null,
    proprietaireNom: (proprio?.nom_complet as string) ?? "",
    proprietaireTelephone: (proprio?.telephone as string) ?? "",
    contactNom: (contact?.nom_complet as string | undefined) ?? null,
    contactTelephone: (contact?.telephone as string | undefined) ?? null,
    creeLe: b.cree_le as string,
  };
}

/**
 * Valeurs brutes d'un bien pour l'édition (ids de zone/ville, pas de libellés).
 * Renvoie null si le bien est absent, supprimé, ou hors agence (RLS).
 */
export async function getBienEdition(id: string): Promise<BienEdition | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("biens")
    .select(
      "id, reference, titre, type, objectif, zone_id, statut_juridique, prix, " +
        "description, video_url, adresse, nombre_chambres, surface_m2, zones(ville_id)"
    )
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (error) throw new Error(`Lecture du bien impossible : ${error.message}`);
  if (!data) return null;

  const b = data as unknown as Record<string, unknown>;
  const zone = premier(b.zones as Record<string, unknown> | Record<string, unknown>[] | null);

  return {
    id: b.id as string,
    reference: b.reference as string,
    titre: (b.titre as string | null) ?? null,
    type: b.type as BienEdition["type"],
    objectif: b.objectif as BienEdition["objectif"],
    villeId: (zone?.ville_id as string) ?? "",
    zoneId: (b.zone_id as string) ?? "",
    adresse: (b.adresse as string | null) ?? null,
    nombreChambres: (b.nombre_chambres as number | null) ?? null,
    surface: (b.surface_m2 as number | null) ?? null,
    statutJuridique: (b.statut_juridique as BienEdition["statutJuridique"]) ?? null,
    prix: (b.prix as number | null) ?? null,
    description: (b.description as string | null) ?? null,
    videoUrl: (b.video_url as string | null) ?? null,
  };
}
