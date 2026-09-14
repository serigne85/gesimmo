import "server-only";
import { createClient } from "@/lib/supabase/server";
import { fusionner } from "@/lib/contrats/fusion";
import {
  formatCommission,
  TYPE_MANDAT_LABELS,
  type CommissionUnite,
  type TypeMandat,
} from "@/types/mandat";
import {
  TYPE_BIEN_LABELS,
  STATUT_JURIDIQUE_LABELS,
  type StatutJuridique,
  type TypeBien,
} from "@/types/bien";
import { formatDate, formatFcfa } from "@/lib/utils/format";
import type { MandatContrat } from "@/types/contrat";

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

/**
 * Charge un mandat avec tout ce qu'il faut pour son contrat : le bien, le mandant
 * (identité civile comprise), l'agence, et le modèle de contrat de la nature.
 * RLS : cloisonné à l'agence.
 */
export async function getMandatContrat(id: string): Promise<MandatContrat | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mandats")
    .select(
      "id, reference, type, exclusif, date_debut, date_fin, commission_valeur, " +
        "commission_unite, contrat_texte, contrat_maj_le, " +
        "bien:biens!bien_id(reference, titre, type, adresse, prix, statut_juridique, " +
        "zone:zones(nom, ville:villes(nom))), " +
        "mandant:contacts!mandant_id(nom_complet, telephone, date_naissance, lieu_naissance, cni), " +
        "agence:agences!agence_id(nom)"
    )
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (error) throw new Error(`Lecture du mandat impossible : ${error.message}`);
  if (!data) return null;

  const row = data as unknown as Record<string, unknown>;
  const bien = premier(row.bien as Record<string, unknown> | Record<string, unknown>[] | null);
  const zone = premier(bien?.zone as Record<string, unknown> | Record<string, unknown>[] | null);
  const ville = premier(zone?.ville as Record<string, unknown> | Record<string, unknown>[] | null);
  const mandant = premier(row.mandant as Record<string, unknown> | Record<string, unknown>[] | null);
  const agence = premier(row.agence as Record<string, unknown> | Record<string, unknown>[] | null);

  const type = row.type as TypeMandat;

  // Modèle de contrat de l'agence pour cette nature (peut être absent → corps vide).
  const { data: modele } = await supabase
    .from("modeles_mandats")
    .select("titre, corps")
    .eq("type", type)
    .maybeSingle();

  return {
    id: row.id as string,
    reference: row.reference as string,
    type,
    exclusif: (row.exclusif as boolean) ?? false,
    dateDebut: (row.date_debut as string | null) ?? null,
    dateFin: (row.date_fin as string | null) ?? null,
    commissionValeur: (row.commission_valeur as number | null) ?? null,
    commissionUnite: (row.commission_unite as CommissionUnite | null) ?? null,
    contratTexte: (row.contrat_texte as string | null) ?? null,
    contratMajLe: (row.contrat_maj_le as string | null) ?? null,
    bien: {
      reference: (bien?.reference as string) ?? "",
      titre: (bien?.titre as string | null) ?? null,
      type: (bien?.type as TypeBien) ?? "autre",
      adresse: (bien?.adresse as string | null) ?? null,
      zoneNom: (zone?.nom as string | null) ?? null,
      villeNom: (ville?.nom as string | null) ?? null,
      prix: (bien?.prix as number | null) ?? null,
      statutJuridique: (bien?.statut_juridique as StatutJuridique | null) ?? null,
    },
    mandant: {
      nomComplet: (mandant?.nom_complet as string) ?? "",
      telephone: (mandant?.telephone as string) ?? "",
      dateNaissance: (mandant?.date_naissance as string | null) ?? null,
      lieuNaissance: (mandant?.lieu_naissance as string | null) ?? null,
      cni: (mandant?.cni as string | null) ?? null,
    },
    agenceNom: (agence?.nom as string) ?? "",
    modeleTitre: (modele?.titre as string | null) ?? `Mandat de ${TYPE_MANDAT_LABELS[type].toLowerCase()}`,
    modeleCorps: (modele?.corps as string | null) ?? "",
  };
}

/** Date/valeur affichables dans un contrat : vide (pas « — ») si absent. */
function d(iso: string | null): string {
  return iso ? formatDate(iso) : "";
}
function fcfa(v: number | null): string {
  return v !== null ? formatFcfa(v) : "";
}

/** Durée en mois entre deux dates, en texte (« 12 mois »), vide si indéterminable. */
function dureeEnMois(debut: string | null, fin: string | null): string {
  if (!debut || !fin) return "";
  const a = new Date(debut);
  const b = new Date(fin);
  const mois =
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  return mois > 0 ? `${mois} mois` : "";
}

/**
 * Construit le dictionnaire de variables `{{cle}}` → valeur pour un mandat.
 * Source unique des clés : lib/contrats/variables.ts (l'éditeur les affiche).
 */
export function construireVariablesMandat(
  mandat: MandatContrat
): Record<string, string> {
  const aujourdhui = new Date().toISOString();
  return {
    reference_mandat: mandat.reference,
    date_du_jour: formatDate(aujourdhui),
    agence_nom: mandat.agenceNom,
    mandant_nom: mandat.mandant.nomComplet,
    mandant_telephone: mandat.mandant.telephone,
    mandant_naissance: d(mandat.mandant.dateNaissance),
    mandant_lieu_naissance: mandat.mandant.lieuNaissance ?? "",
    mandant_cni: mandat.mandant.cni ?? "",
    bien_reference: mandat.bien.reference,
    bien_titre: mandat.bien.titre ?? "",
    bien_type: TYPE_BIEN_LABELS[mandat.bien.type],
    bien_adresse: mandat.bien.adresse ?? "",
    bien_zone: mandat.bien.zoneNom ?? "",
    bien_ville: mandat.bien.villeNom ?? "",
    bien_prix: fcfa(mandat.bien.prix),
    bien_statut_juridique: mandat.bien.statutJuridique
      ? STATUT_JURIDIQUE_LABELS[mandat.bien.statutJuridique]
      : "",
    commission: formatCommission(mandat.commissionValeur, mandat.commissionUnite),
    date_effet: d(mandat.dateDebut),
    date_fin: d(mandat.dateFin),
    duree: dureeEnMois(mandat.dateDebut, mandat.dateFin),
    exclusivite: mandat.exclusif ? "exclusif" : "simple",
  };
}

/** Génère le texte du contrat depuis le modèle + les données du mandat. */
export function genererContratMandat(mandat: MandatContrat): string {
  return fusionner(mandat.modeleCorps, construireVariablesMandat(mandat));
}
