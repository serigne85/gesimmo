import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BienListe } from "@/types/bien";

export const BIENS_PAGE_SIZE = 20;

export type BiensPage = {
  rows: BienListe[];
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
 * Liste paginée des biens de l'agence (RLS : cloisonné automatiquement).
 * Les libellés de zone/ville et le propriétaire sont joints en une requête.
 */
export async function listBiens(page = 1): Promise<BiensPage> {
  const supabase = await createClient();
  const from = (page - 1) * BIENS_PAGE_SIZE;
  const to = from + BIENS_PAGE_SIZE - 1;

  const { data, count, error } = await supabase
    .from("biens")
    .select(
      "id, reference, type, objectif, statut, prix, " +
        "zones(nom, villes(nom)), " +
        "contacts(nom_complet, telephone)",
      { count: "exact" }
    )
    .is("supprime_le", null)
    .order("cree_le", { ascending: false })
    .range(from, to);

  if (error) throw new Error(`Lecture des biens impossible : ${error.message}`);

  // Sans types Supabase générés, la jointure est mal inférée : on caste en type
  // souple avant de mapper vers le type fort BienListe.
  const lignes = (data ?? []) as unknown as Record<string, unknown>[];
  const rows: BienListe[] = lignes.map((b) => {
    const zone = premier(b.zones as Record<string, unknown> | Record<string, unknown>[] | null);
    const ville = zone ? premier(zone.villes as Record<string, unknown> | Record<string, unknown>[] | null) : null;
    const proprio = premier(b.contacts as Record<string, unknown> | Record<string, unknown>[] | null);

    return {
      id: b.id as string,
      reference: b.reference as string,
      type: b.type as BienListe["type"],
      objectif: b.objectif as BienListe["objectif"],
      statut: b.statut as BienListe["statut"],
      prix: (b.prix as number | null) ?? null,
      zoneNom: (zone?.nom as string) ?? null,
      villeNom: (ville?.nom as string) ?? null,
      proprietaireNom: (proprio?.nom_complet as string) ?? "",
      proprietaireTelephone: (proprio?.telephone as string) ?? "",
    };
  });

  return { rows, total: count ?? 0, page, pageSize: BIENS_PAGE_SIZE };
}
