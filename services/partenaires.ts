import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  PartenaireListe,
  PartenaireDetail,
  PartenaireEdition,
  PartenaireOption,
  TypePartenaire,
} from "@/types/partenaire";

export const PARTENAIRES_PAGE_SIZE = 20;

export type PartenairesPage = {
  rows: PartenaireListe[];
  total: number;
  page: number;
  pageSize: number;
};

/** Filtres optionnels de la liste des partenaires. */
export type FiltresPartenaires = {
  type?: TypePartenaire;
  actif?: boolean;
};

/**
 * Liste paginée des partenaires de l'agence (RLS : cloisonné automatiquement).
 * Les lignes supprimées sont masquées ici, au niveau requête (cf. 0016).
 */
export async function listPartenaires(
  page = 1,
  filtres: FiltresPartenaires = {}
): Promise<PartenairesPage> {
  const supabase = await createClient();
  const from = (page - 1) * PARTENAIRES_PAGE_SIZE;
  const to = from + PARTENAIRES_PAGE_SIZE - 1;

  let query = supabase
    .from("partenaires")
    .select(
      "id, nom, type, telephone, email, taux_commission_defaut, actif, cree_le",
      { count: "exact" }
    )
    .is("supprime_le", null);

  if (filtres.type) query = query.eq("type", filtres.type);
  if (filtres.actif !== undefined) query = query.eq("actif", filtres.actif);

  const { data, count, error } = await query
    .order("actif", { ascending: false })
    .order("nom", { ascending: true })
    .range(from, to);

  if (error) {
    throw new Error(`Lecture des partenaires impossible : ${error.message}`);
  }

  const rows: PartenaireListe[] = (data ?? []).map((p) => ({
    id: p.id as string,
    nom: p.nom as string,
    type: p.type as TypePartenaire,
    telephone: (p.telephone as string | null) ?? null,
    email: (p.email as string | null) ?? null,
    tauxCommissionDefaut: (p.taux_commission_defaut as number | null) ?? null,
    actif: p.actif as boolean,
    creeLe: p.cree_le as string,
  }));

  return { rows, total: count ?? 0, page, pageSize: PARTENAIRES_PAGE_SIZE };
}

/**
 * Fiche détail d'un partenaire. Renvoie null s'il n'existe pas, est supprimé,
 * ou appartient à une autre agence (masqué par la RLS).
 */
export async function getPartenaireById(
  id: string
): Promise<PartenaireDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("partenaires")
    .select(
      "id, nom, type, telephone, email, taux_commission_defaut, notes, actif, cree_le"
    )
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Lecture du partenaire impossible : ${error.message}`);
  }
  if (!data) return null;

  return {
    id: data.id as string,
    nom: data.nom as string,
    type: data.type as TypePartenaire,
    telephone: (data.telephone as string | null) ?? null,
    email: (data.email as string | null) ?? null,
    tauxCommissionDefaut: (data.taux_commission_defaut as number | null) ?? null,
    notes: (data.notes as string | null) ?? null,
    actif: data.actif as boolean,
    creeLe: data.cree_le as string,
  };
}

/** Valeurs brutes d'un partenaire pour l'édition. */
export async function getPartenaireEdition(
  id: string
): Promise<PartenaireEdition | null> {
  const detail = await getPartenaireById(id);
  if (!detail) return null;
  return {
    id: detail.id,
    nom: detail.nom,
    type: detail.type,
    telephone: detail.telephone,
    email: detail.email,
    tauxCommissionDefaut: detail.tauxCommissionDefaut,
    notes: detail.notes,
    actif: detail.actif,
  };
}

/**
 * Partenaires actifs, forme légère pour un sélecteur (soumettre une demande).
 */
export async function listPartenairesOptions(): Promise<PartenaireOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("partenaires")
    .select("id, nom, type")
    .is("supprime_le", null)
    .eq("actif", true)
    .order("nom", { ascending: true });

  if (error) {
    throw new Error(`Lecture des partenaires impossible : ${error.message}`);
  }

  return (data ?? []).map((p) => ({
    id: p.id as string,
    nom: p.nom as string,
    type: p.type as TypePartenaire,
  }));
}
