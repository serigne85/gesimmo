import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TypeBien, StatutBien, ObjectifBien } from "@/types/bien";
import type {
  ObjectifDemande,
  BienCorrespondant,
  DemandeListe,
} from "@/types/demande";

/**
 * Statuts d'un bien considérés comme « offre active » : seuls ceux-là sont
 * proposés au matching. Un bien vendu / loué / suspendu / archivé / perdu ne
 * ressort pas.
 */
const STATUTS_MATCHABLES: StatutBien[] = [
  "prospecte",
  "sous_mandat",
  "disponible",
  "sous_offre",
];

/** Objectif de bien correspondant à l'objectif d'une demande. */
function objectifBienPour(o: ObjectifDemande): ObjectifBien {
  return o === "achat" ? "vente" : "location";
}

/** Objectif de demande correspondant à l'objectif d'un bien. */
function objectifDemandePour(o: ObjectifBien): ObjectifDemande {
  return o === "vente" ? "achat" : "location";
}

function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

/** Critères d'une demande, tels qu'utilisés pour trouver des biens. */
export type CriteresDemande = {
  objectif: ObjectifDemande;
  zoneIds: string[];
  types: TypeBien[];
  budgetMin: number | null;
  budgetMax: number | null;
  nombreChambresMin: number | null;
  surfaceMin: number | null;
};

/**
 * Biens correspondant à une demande. Tout le filtrage se fait en SQL. Un
 * critère non renseigné n'applique aucune contrainte ; un bien dont le prix /
 * nombre de chambres / surface est inconnu (null) n'est jamais exclu (« .or »
 * avec is.null), il reste à vérifier par l'agent.
 */
export async function biensCorrespondants(
  c: CriteresDemande
): Promise<BienCorrespondant[]> {
  const supabase = await createClient();

  let query = supabase
    .from("biens")
    .select("id, reference, titre, type, statut, prix, cree_le, zones(nom, villes(nom))")
    .is("supprime_le", null)
    .eq("objectif", objectifBienPour(c.objectif))
    .in("statut", STATUTS_MATCHABLES);

  if (c.zoneIds.length > 0) query = query.in("zone_id", c.zoneIds);
  if (c.types.length > 0) query = query.in("type", c.types);
  if (c.budgetMax !== null) query = query.or(`prix.is.null,prix.lte.${c.budgetMax}`);
  if (c.budgetMin !== null) query = query.or(`prix.is.null,prix.gte.${c.budgetMin}`);
  if (c.nombreChambresMin !== null)
    query = query.or(`nombre_chambres.is.null,nombre_chambres.gte.${c.nombreChambresMin}`);
  if (c.surfaceMin !== null)
    query = query.or(`surface_m2.is.null,surface_m2.gte.${c.surfaceMin}`);

  const { data, error } = await query
    .order("cree_le", { ascending: false })
    .limit(50);

  if (error) throw new Error(`Matching des biens impossible : ${error.message}`);

  const lignes = (data ?? []) as unknown as Record<string, unknown>[];
  return lignes.map((b) => {
    const zone = premier(b.zones as Record<string, unknown> | Record<string, unknown>[] | null);
    const ville = zone ? premier(zone.villes as Record<string, unknown> | Record<string, unknown>[] | null) : null;
    return {
      id: b.id as string,
      reference: b.reference as string,
      titre: (b.titre as string | null) ?? null,
      type: b.type as TypeBien,
      statut: b.statut as StatutBien,
      zoneNom: (zone?.nom as string) ?? null,
      villeNom: (ville?.nom as string) ?? null,
      prix: (b.prix as number | null) ?? null,
    };
  });
}

/** Caractéristiques d'un bien, telles qu'utilisées pour trouver des demandes. */
export type CriteresBien = {
  objectif: ObjectifBien;
  zoneId: string | null;
  type: TypeBien;
  prix: number | null;
  nombreChambres: number | null;
  surface: number | null;
};

/**
 * Demandes actives correspondant à un bien. Les contraintes portent sur la
 * demande et ses tables de liaison (« la demande cible cette zone, ou aucune ») :
 * on charge les demandes actives du bon objectif puis on filtre en mémoire —
 * leur nombre reste modeste, et le code reste clair.
 */
export async function demandesCorrespondantes(
  b: CriteresBien
): Promise<DemandeListe[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("demandes")
    .select(
      "id, objectif, statut, budget_min, budget_max, nombre_chambres_min, " +
        "surface_min, cree_le, " +
        "client:contacts(nom_complet, telephone), " +
        "demande_zones(zone_id, zones(nom)), " +
        "demande_types(type)"
    )
    .is("supprime_le", null)
    .eq("statut", "active")
    .eq("objectif", objectifDemandePour(b.objectif))
    .order("cree_le", { ascending: false });

  if (error) throw new Error(`Matching des demandes impossible : ${error.message}`);

  const lignes = (data ?? []) as unknown as Record<string, unknown>[];
  const resultats: DemandeListe[] = [];

  for (const d of lignes) {
    const zonesLiees = (d.demande_zones as Record<string, unknown>[] | null) ?? [];
    const zoneIds = zonesLiees.map((dz) => dz.zone_id as string);
    const typesLies = (d.demande_types as Record<string, unknown>[] | null) ?? [];
    const types = typesLies.map((dt) => dt.type as TypeBien);

    // Contraintes zone / type : vides = « toutes / tous ».
    if (zoneIds.length > 0 && (!b.zoneId || !zoneIds.includes(b.zoneId))) continue;
    if (types.length > 0 && !types.includes(b.type)) continue;

    const budgetMax = (d.budget_max as number | null) ?? null;
    const budgetMin = (d.budget_min as number | null) ?? null;
    const chambresMin = (d.nombre_chambres_min as number | null) ?? null;
    const surfaceMin = (d.surface_min as number | null) ?? null;

    // Prix / chambres / surface inconnus sur le bien : on n'exclut pas.
    if (b.prix !== null) {
      if (budgetMax !== null && b.prix > budgetMax) continue;
      if (budgetMin !== null && b.prix < budgetMin) continue;
    }
    if (chambresMin !== null && b.nombreChambres !== null && b.nombreChambres < chambresMin) continue;
    if (surfaceMin !== null && b.surface !== null && b.surface < surfaceMin) continue;

    const client = premier(
      d.client as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const zonesNoms = zonesLiees
      .map((dz) => {
        const zone = premier(dz.zones as Record<string, unknown> | Record<string, unknown>[] | null);
        return (zone?.nom as string) ?? null;
      })
      .filter((n): n is string => !!n);

    resultats.push({
      id: d.id as string,
      clientNom: (client?.nom_complet as string) ?? "",
      clientTelephone: (client?.telephone as string) ?? "",
      objectif: d.objectif as DemandeListe["objectif"],
      statut: d.statut as DemandeListe["statut"],
      budgetMin,
      budgetMax,
      nombreChambresMin: chambresMin,
      surfaceMin,
      zones: zonesNoms,
      types,
      creeLe: d.cree_le as string,
    });
  }

  return resultats;
}
