import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  TacheListe,
  TacheDetail,
  TypeTache,
  PrioriteTache,
  StatutTache,
  LienTache,
} from "@/types/tache";

export const TACHES_PAGE_SIZE = 20;

export type TachesPage = {
  rows: TacheListe[];
  total: number;
  page: number;
  pageSize: number;
};

/** Filtres optionnels de la liste des tâches (cumulables). */
export type FiltresTaches = {
  statut?: StatutTache;
  type?: TypeTache;
  priorite?: PrioriteTache;
  assigneeId?: string;
};

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

/**
 * Liste paginée des tâches de l'agence (RLS : cloisonné automatiquement).
 * L'assigné est joint pour afficher son nom. Tri : échéance la plus proche
 * d'abord (sans échéance en dernier), puis les plus récemment créées.
 */
export async function listTaches(
  page = 1,
  filtres: FiltresTaches = {}
): Promise<TachesPage> {
  const supabase = await createClient();
  const from = (page - 1) * TACHES_PAGE_SIZE;
  const to = from + TACHES_PAGE_SIZE - 1;

  let query = supabase
    .from("taches")
    .select(
      "id, titre, type, priorite, statut, date_echeance, lien_type, lien_id, " +
        "cree_le, assignee:utilisateurs!taches_assignee_id_fkey(nom_complet)",
      { count: "exact" }
    )
    .is("supprime_le", null);

  if (filtres.statut) query = query.eq("statut", filtres.statut);
  if (filtres.type) query = query.eq("type", filtres.type);
  if (filtres.priorite) query = query.eq("priorite", filtres.priorite);
  if (filtres.assigneeId) query = query.eq("assignee_id", filtres.assigneeId);

  const { data, count, error } = await query
    .order("date_echeance", { ascending: true, nullsFirst: false })
    .order("cree_le", { ascending: false })
    .range(from, to);

  if (error) throw new Error(`Lecture des tâches impossible : ${error.message}`);

  const rows: TacheListe[] = (
    (data ?? []) as unknown as Record<string, unknown>[]
  ).map((t) => {
    const assignee = premier(
      t.assignee as Record<string, unknown> | Record<string, unknown>[] | null
    );
    return {
      id: t.id as string,
      titre: t.titre as string,
      type: t.type as TypeTache,
      priorite: t.priorite as PrioriteTache,
      statut: t.statut as StatutTache,
      dateEcheance: (t.date_echeance as string | null) ?? null,
      assigneeNom: (assignee?.nom_complet as string | null) ?? null,
      lienType: (t.lien_type as LienTache | null) ?? null,
      lienId: (t.lien_id as string | null) ?? null,
      creeLe: t.cree_le as string,
    };
  });

  return { rows, total: count ?? 0, page, pageSize: TACHES_PAGE_SIZE };
}

/**
 * Fiche détail / valeurs d'édition d'une tâche. Renvoie null si absente,
 * supprimée, ou hors agence (RLS).
 */
export async function getTacheById(id: string): Promise<TacheDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("taches")
    .select(
      "id, titre, description, type, priorite, statut, date_echeance, fait_le, " +
        "assignee_id, lien_type, lien_id, cree_le, " +
        "assignee:utilisateurs!taches_assignee_id_fkey(nom_complet)"
    )
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (error) throw new Error(`Lecture de la tâche impossible : ${error.message}`);
  if (!data) return null;

  const t = data as unknown as Record<string, unknown>;
  const assignee = premier(
    t.assignee as Record<string, unknown> | Record<string, unknown>[] | null
  );

  return {
    id: t.id as string,
    titre: t.titre as string,
    description: (t.description as string | null) ?? null,
    type: t.type as TypeTache,
    priorite: t.priorite as PrioriteTache,
    statut: t.statut as StatutTache,
    dateEcheance: (t.date_echeance as string | null) ?? null,
    faitLe: (t.fait_le as string | null) ?? null,
    assigneeId: (t.assignee_id as string | null) ?? null,
    assigneeNom: (assignee?.nom_complet as string | null) ?? null,
    lienType: (t.lien_type as LienTache | null) ?? null,
    lienId: (t.lien_id as string | null) ?? null,
    creeLe: t.cree_le as string,
  };
}
