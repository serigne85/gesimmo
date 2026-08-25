import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MandatListe, BienSelectionnable } from "@/types/mandat";

export const MANDATS_PAGE_SIZE = 20;

export type MandatsPage = {
  rows: MandatListe[];
  total: number;
  page: number;
  pageSize: number;
};

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

/**
 * Liste paginée des mandats de l'agence (RLS : cloisonné automatiquement).
 * Le bien et le mandant sont joints en une requête.
 */
export async function listMandats(page = 1): Promise<MandatsPage> {
  const supabase = await createClient();
  const from = (page - 1) * MANDATS_PAGE_SIZE;
  const to = from + MANDATS_PAGE_SIZE - 1;

  const { data, count, error } = await supabase
    .from("mandats")
    .select(
      "id, reference, type, statut, exclusif, date_debut, date_fin, " +
        "commission_valeur, commission_unite, " +
        "biens(reference, titre), " +
        "mandant:contacts(nom_complet)",
      { count: "exact" }
    )
    .is("supprime_le", null)
    .order("cree_le", { ascending: false })
    .range(from, to);

  if (error) throw new Error(`Lecture des mandats impossible : ${error.message}`);

  const lignes = (data ?? []) as unknown as Record<string, unknown>[];
  const rows: MandatListe[] = lignes.map((m) => {
    const bien = premier(
      m.biens as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const mandant = premier(
      m.mandant as Record<string, unknown> | Record<string, unknown>[] | null
    );

    return {
      id: m.id as string,
      reference: m.reference as string,
      type: m.type as MandatListe["type"],
      statut: m.statut as MandatListe["statut"],
      exclusif: !!m.exclusif,
      dateDebut: (m.date_debut as string | null) ?? null,
      dateFin: (m.date_fin as string | null) ?? null,
      bienReference: (bien?.reference as string) ?? "",
      bienTitre: (bien?.titre as string | null) ?? null,
      mandantNom: (mandant?.nom_complet as string) ?? "",
      commissionValeur: (m.commission_valeur as number | null) ?? null,
      commissionUnite: (m.commission_unite as MandatListe["commissionUnite"]) ?? null,
    };
  });

  return { rows, total: count ?? 0, page, pageSize: MANDATS_PAGE_SIZE };
}

/**
 * Biens éligibles pour la création d'un mandat : non supprimés, non archivés.
 * On rapporte le statut juridique (règle « vente ⇒ statut juridique requis »)
 * et le propriétaire (futur mandant, pré-rempli).
 */
export async function listBiensSelectionnables(): Promise<BienSelectionnable[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("biens")
    .select(
      "id, reference, titre, type, objectif, statut_juridique, " +
        "proprietaire:contacts!proprietaire_id(nom_complet)"
    )
    .is("supprime_le", null)
    .neq("statut", "archive")
    .order("cree_le", { ascending: false });

  if (error) throw new Error(`Lecture des biens impossible : ${error.message}`);

  const lignes = (data ?? []) as unknown as Record<string, unknown>[];
  return lignes.map((b) => {
    const proprio = premier(
      b.proprietaire as Record<string, unknown> | Record<string, unknown>[] | null
    );
    return {
      id: b.id as string,
      reference: b.reference as string,
      titre: (b.titre as string | null) ?? null,
      type: b.type as BienSelectionnable["type"],
      objectif: b.objectif as BienSelectionnable["objectif"],
      statutJuridique: (b.statut_juridique as BienSelectionnable["statutJuridique"]) ?? null,
      proprietaireNom: (proprio?.nom_complet as string) ?? "",
    };
  });
}
