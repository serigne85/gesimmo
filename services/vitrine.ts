import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TypeBien, ObjectifBien, StatutJuridique } from "@/types/bien";

/**
 * Lecture PUBLIQUE des biens pour le site vitrine.
 *
 * SÉCURITÉ — c'est le garde-barrière entre la base et Internet :
 *  - un visiteur n'est pas connecté, donc la RLS (filtrée par agence + session)
 *    ne renverrait rien ; on lit ici avec le client admin, côté serveur uniquement
 *    (le service_role ne quitte jamais le serveur, cf. lib/supabase/admin.ts) ;
 *  - on ne renvoie QUE des biens `disponible` non supprimés ;
 *  - on ne sélectionne QUE des colonnes publiques. Le nom et le téléphone du
 *    propriétaire ne sont jamais lus ni exposés.
 *
 * Multi-agence : la V1 n'a qu'une agence, on publie donc tous les biens
 * disponibles. Quand il y aura plusieurs agences, il faudra filtrer par
 * l'agence propriétaire du site (ex. via une variable d'environnement).
 */

const BUCKET = "biens";
const URL_VALIDITE_S = 3600; // URLs signées valables 1 heure
export const VITRINE_PAGE_SIZE = 12;

/** Un bien tel qu'affiché publiquement (aucune donnée propriétaire). */
export type BienVitrine = {
  id: string;
  reference: string;
  titre: string | null;
  type: TypeBien;
  objectif: ObjectifBien;
  prix: number | null;
  villeNom: string | null;
  zoneNom: string | null;
  surface: number | null; // en m²
  nombreChambres: number | null;
  photoUrl: string | null;
};

/** Fiche détail publique d'un bien (aucune donnée propriétaire, pas d'adresse). */
export type BienVitrineDetail = {
  id: string;
  reference: string;
  titre: string | null;
  type: TypeBien;
  objectif: ObjectifBien;
  prix: number | null;
  description: string | null;
  villeNom: string | null;
  zoneNom: string | null;
  surface: number | null; // en m²
  nombreChambres: number | null;
  statutJuridique: StatutJuridique | null;
  videoUrl: string | null;
  photos: string[]; // URLs signées, ordonnées (principale en premier)
};

export type FiltresVitrine = {
  objectif?: ObjectifBien;
  type?: TypeBien;
  zoneId?: string;
};

export type VitrinePage = {
  rows: BienVitrine[];
  total: number;
  page: number;
  pageSize: number;
};

export type ZoneVitrineOption = { id: string; nom: string; villeNom: string };

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Vrai si `valeur` est un UUID. Sert de garde avant toute requête filtrée par
 * id : une valeur trafiquée dans l'URL provoquerait sinon une erreur SQL
 * (« invalid input syntax for type uuid »).
 */
export function estUuid(valeur: string): boolean {
  return UUID_RE.test(valeur);
}

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Applique les filtres publics (objectif, type, ville) à une requête. Factorisé
 * pour être réutilisé à l'identique par la requête de comptage ET celle de
 * données. Le filtre ville s'appuie sur la jointure `zones!inner`.
 *
 * Les types de supabase-js sont trop profonds pour une contrainte générique ici
 * (sans types générés) : on caste vers une interface minimale « qui a .eq », on
 * applique, puis on recaste vers le type d'origine.
 */
type QueryEq = { eq(colonne: string, valeur: string): QueryEq };

function appliquerFiltres<T>(query: T, filtres: FiltresVitrine): T {
  let q = query as unknown as QueryEq;
  if (filtres.objectif) q = q.eq("objectif", filtres.objectif);
  if (filtres.type) q = q.eq("type", filtres.type);
  if (filtres.zoneId) q = q.eq("zone_id", filtres.zoneId);
  return q as unknown as T;
}

/**
 * URLs signées des photos principales pour un lot de biens (une seule requête +
 * une seule signature : on évite le N+1). Renvoie une Map bien_id → url.
 */
async function urlsPhotosPrincipales(
  admin: Admin,
  bienIds: string[]
): Promise<Map<string, string>> {
  const resultat = new Map<string, string>();
  if (bienIds.length === 0) return resultat;

  const { data, error } = await admin
    .from("photos_bien")
    .select("bien_id, chemin")
    .in("bien_id", bienIds)
    .eq("est_principale", true);

  if (error) throw new Error(`Lecture des photos impossible : ${error.message}`);
  const rows = data ?? [];
  if (rows.length === 0) return resultat;

  const { data: signed, error: sErr } = await admin.storage
    .from(BUCKET)
    .createSignedUrls(
      rows.map((r) => r.chemin as string),
      URL_VALIDITE_S
    );

  if (sErr) throw new Error(`Génération des URLs impossible : ${sErr.message}`);

  const urlParChemin = new Map<string, string>();
  (signed ?? []).forEach((s) => {
    if (s.path && s.signedUrl) urlParChemin.set(s.path, s.signedUrl);
  });

  rows.forEach((r) => {
    const url = urlParChemin.get(r.chemin as string);
    if (url) resultat.set(r.bien_id as string, url);
  });
  return resultat;
}

/**
 * Liste paginée des biens disponibles pour le public, avec filtres optionnels
 * (objectif, type, ville). Trie du plus récent au plus ancien.
 */
export async function listBiensVitrine(
  page = 1,
  filtres: FiltresVitrine = {}
): Promise<VitrinePage> {
  const admin = createAdminClient();

  // 1) Compter d'abord. Sans ça, demander une page au-delà des résultats
  //    (?page=2 alors qu'il n'y a qu'une page) ferait échouer PostgREST avec une
  //    erreur « range not satisfiable ». `head: true` ne renvoie que le total.
  const compte = appliquerFiltres(
    admin
      .from("biens")
      .select("id", { count: "exact", head: true })
      .eq("statut", "disponible")
      .eq("publie", true)
      .is("supprime_le", null),
    filtres
  );
  const { count, error: countError } = await compte;
  if (countError) {
    throw new Error(`Comptage des biens publics impossible : ${countError.message}`);
  }
  const total = count ?? 0;

  const from = (page - 1) * VITRINE_PAGE_SIZE;
  // Page vide ou hors limites : on renvoie une liste vide sans requêter de lignes.
  if (total === 0 || from >= total) {
    return { rows: [], total, page, pageSize: VITRINE_PAGE_SIZE };
  }
  const to = Math.min(from + VITRINE_PAGE_SIZE - 1, total - 1);

  // 2) Charger les lignes de la page. `zones!inner` : jointure interne pour
  //    pouvoir filtrer par ville_id. Tout bien a obligatoirement une zone.
  const query = appliquerFiltres(
    admin
      .from("biens")
      .select(
        "id, reference, titre, type, objectif, prix, surface_m2, nombre_chambres, " +
          "zones!inner(nom, ville_id, villes(nom))"
      )
      .eq("statut", "disponible")
      .eq("publie", true)
      .is("supprime_le", null),
    filtres
  );

  const { data, error } = await query
    .order("cree_le", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Lecture des biens publics impossible : ${error.message}`);
  }

  const lignes = (data ?? []) as unknown as Record<string, unknown>[];
  const photos = await urlsPhotosPrincipales(
    admin,
    lignes.map((b) => b.id as string)
  );

  const rows: BienVitrine[] = lignes.map((b) => {
    const zone = premier(
      b.zones as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const ville = zone
      ? premier(zone.villes as Record<string, unknown> | Record<string, unknown>[] | null)
      : null;

    return {
      id: b.id as string,
      reference: b.reference as string,
      titre: (b.titre as string | null) ?? null,
      type: b.type as TypeBien,
      objectif: b.objectif as ObjectifBien,
      prix: (b.prix as number | null) ?? null,
      villeNom: (ville?.nom as string) ?? null,
      zoneNom: (zone?.nom as string) ?? null,
      surface: (b.surface_m2 as number | null) ?? null,
      nombreChambres: (b.nombre_chambres as number | null) ?? null,
      photoUrl: photos.get(b.id as string) ?? null,
    };
  });

  return { rows, total, page, pageSize: VITRINE_PAGE_SIZE };
}

/** Toutes les photos d'un bien (URLs signées), principale en premier puis ordre. */
async function photosBienVitrine(admin: Admin, bienId: string): Promise<string[]> {
  const { data, error } = await admin
    .from("photos_bien")
    .select("chemin")
    .eq("bien_id", bienId)
    .order("est_principale", { ascending: false })
    .order("ordre", { ascending: true });

  if (error) throw new Error(`Lecture des photos impossible : ${error.message}`);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const { data: signed, error: sErr } = await admin.storage
    .from(BUCKET)
    .createSignedUrls(
      rows.map((r) => r.chemin as string),
      URL_VALIDITE_S
    );

  if (sErr) throw new Error(`Génération des URLs impossible : ${sErr.message}`);

  const urlParChemin = new Map<string, string>();
  (signed ?? []).forEach((s) => {
    if (s.path && s.signedUrl) urlParChemin.set(s.path, s.signedUrl);
  });
  // On mappe depuis `rows` pour conserver l'ordre (principale d'abord).
  return rows
    .map((r) => urlParChemin.get(r.chemin as string))
    .filter((u): u is string => Boolean(u));
}

/**
 * Fiche détail publique d'un bien. Renvoie null si l'id n'est pas un UUID, si le
 * bien n'existe pas, n'est pas `disponible`, ou est supprimé (→ page 404).
 * N'expose ni l'adresse exacte ni le propriétaire.
 */
export async function getBienVitrineById(
  id: string
): Promise<BienVitrineDetail | null> {
  if (!estUuid(id)) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("biens")
    .select(
      "id, reference, titre, type, objectif, prix, description, surface_m2, " +
        "nombre_chambres, statut_juridique, video_url, zones(nom, villes(nom))"
    )
    .eq("id", id)
    .eq("statut", "disponible")
    .eq("publie", true)
    .is("supprime_le", null)
    .maybeSingle();

  if (error) throw new Error(`Lecture du bien public impossible : ${error.message}`);
  if (!data) return null;

  const b = data as unknown as Record<string, unknown>;
  const zone = premier(
    b.zones as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const ville = zone
    ? premier(zone.villes as Record<string, unknown> | Record<string, unknown>[] | null)
    : null;

  const photos = await photosBienVitrine(admin, id);

  return {
    id: b.id as string,
    reference: b.reference as string,
    titre: (b.titre as string | null) ?? null,
    type: b.type as TypeBien,
    objectif: b.objectif as ObjectifBien,
    prix: (b.prix as number | null) ?? null,
    description: (b.description as string | null) ?? null,
    villeNom: (ville?.nom as string) ?? null,
    zoneNom: (zone?.nom as string) ?? null,
    surface: (b.surface_m2 as number | null) ?? null,
    nombreChambres: (b.nombre_chambres as number | null) ?? null,
    statutJuridique: (b.statut_juridique as StatutJuridique | null) ?? null,
    videoUrl: (b.video_url as string | null) ?? null,
    photos,
  };
}

/**
 * URL signée de la photo principale d'un bien, mais UNIQUEMENT si ce bien est
 * public (`disponible`, non supprimé). Utilisée par la route-image
 * /api/vitrine/photo/[bienId] : impossible d'en abuser pour lire les photos d'un
 * bien non publié. Renvoie null si l'id est invalide, le bien non public, ou
 * sans photo principale.
 */
export async function getUrlPhotoPrincipalePublique(
  bienId: string
): Promise<string | null> {
  if (!estUuid(bienId)) return null;

  const admin = createAdminClient();

  const { data: bien, error: bErr } = await admin
    .from("biens")
    .select("id")
    .eq("id", bienId)
    .eq("statut", "disponible")
    .eq("publie", true)
    .is("supprime_le", null)
    .maybeSingle();
  if (bErr) throw new Error(`Vérification du bien impossible : ${bErr.message}`);
  if (!bien) return null;

  const { data: photo, error: pErr } = await admin
    .from("photos_bien")
    .select("chemin")
    .eq("bien_id", bienId)
    .eq("est_principale", true)
    .maybeSingle();
  if (pErr) throw new Error(`Lecture de la photo impossible : ${pErr.message}`);
  if (!photo) return null;

  const { data: signed, error: sErr } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(photo.chemin as string, URL_VALIDITE_S);
  if (sErr) throw new Error(`Génération de l'URL impossible : ${sErr.message}`);

  return signed?.signedUrl ?? null;
}

/**
 * Zones disponibles pour le filtre public : seulement celles qui ont AU MOINS un
 * bien en ligne (disponible ET publié), pour ne pas proposer de zone vide. On
 * déduplique côté serveur. Le nom de la ville accompagne la zone (deux zones
 * peuvent partager un nom dans des villes différentes).
 */
export async function listZonesVitrine(): Promise<ZoneVitrineOption[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("biens")
    .select("zone_id, zones!inner(nom, villes(nom))")
    .eq("statut", "disponible")
    .eq("publie", true)
    .is("supprime_le", null);

  if (error) throw new Error(`Lecture des zones impossible : ${error.message}`);

  const parId = new Map<string, ZoneVitrineOption>();
  for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
    const id = row.zone_id as string;
    if (!id || parId.has(id)) continue;
    const zone = premier(
      row.zones as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const ville = zone
      ? premier(zone.villes as Record<string, unknown> | Record<string, unknown>[] | null)
      : null;
    parId.set(id, {
      id,
      nom: (zone?.nom as string) ?? "",
      villeNom: (ville?.nom as string) ?? "",
    });
  }

  return [...parId.values()].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}
