import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TypePartenaire } from "@/types/partenaire";
import type {
  MiseEnRelationListe,
  MiseEnRelationDetail,
  SuiviEvenement,
  SensMiseEnRelation,
  StatutMiseEnRelation,
  TypeSuivi,
} from "@/types/mise-en-relation";

export const MER_PAGE_SIZE = 20;

export type MisesEnRelationPage = {
  rows: MiseEnRelationListe[];
  total: number;
  page: number;
  pageSize: number;
};

/** Filtres optionnels de la liste. */
export type FiltresMER = {
  statut?: StatutMiseEnRelation;
  partenaireId?: string;
  demandeId?: string;
};

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

/**
 * Liste paginée des mises en relation de l'agence (RLS cloisonnée). Le client
 * (via la demande) et le partenaire sont joints en une requête.
 */
export async function listMisesEnRelation(
  page = 1,
  filtres: FiltresMER = {}
): Promise<MisesEnRelationPage> {
  const supabase = await createClient();
  const from = (page - 1) * MER_PAGE_SIZE;
  const to = from + MER_PAGE_SIZE - 1;

  let query = supabase
    .from("mises_en_relation")
    .select(
      "id, sens, statut, part_agence, commission_percue, " +
        "date_soumission, cree_le, " +
        "demande:demandes(contact:contacts(nom_complet, telephone)), " +
        "partenaire:partenaires(nom, type), " +
        "bien:biens(reference, titre)",
      { count: "exact" }
    )
    .is("supprime_le", null);

  if (filtres.statut) query = query.eq("statut", filtres.statut);
  if (filtres.partenaireId) query = query.eq("partenaire_id", filtres.partenaireId);
  if (filtres.demandeId) query = query.eq("demande_id", filtres.demandeId);

  const { data, count, error } = await query
    .order("date_soumission", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Lecture des mises en relation impossible : ${error.message}`);
  }

  const lignes = (data ?? []) as unknown as Record<string, unknown>[];
  const rows: MiseEnRelationListe[] = lignes.map((m) => {
    const demande = premier(
      m.demande as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const client = premier(
      demande?.contact as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const partenaire = premier(
      m.partenaire as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const bien = premier(
      m.bien as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const bienResume = bien
      ? ((bien.titre as string | null) ?? (bien.reference as string | null))
      : null;

    return {
      id: m.id as string,
      sens: m.sens as SensMiseEnRelation,
      statut: m.statut as StatutMiseEnRelation,
      clientNom: (client?.nom_complet as string) ?? "",
      clientTelephone: (client?.telephone as string) ?? "",
      partenaireNom: (partenaire?.nom as string) ?? "",
      partenaireType: (partenaire?.type as TypePartenaire) ?? "autre",
      bienResume,
      partAgence: (m.part_agence as number | null) ?? null,
      commissionPercue: (m.commission_percue as number | null) ?? null,
      dateSoumission: m.date_soumission as string,
      creeLe: m.cree_le as string,
    };
  });

  return { rows, total: count ?? 0, page, pageSize: MER_PAGE_SIZE };
}

/** Journal chronologique d'une mise en relation (le plus récent d'abord). */
async function getSuivi(
  supabase: Awaited<ReturnType<typeof createClient>>,
  miseEnRelationId: string
): Promise<SuiviEvenement[]> {
  const { data, error } = await supabase
    .from("suivi_mises_en_relation")
    .select("id, type, description, date_evenement, cree_le, auteur:utilisateurs(nom_complet)")
    .eq("mise_en_relation_id", miseEnRelationId)
    .order("date_evenement", { ascending: false });

  if (error) {
    throw new Error(`Lecture du suivi impossible : ${error.message}`);
  }

  return ((data ?? []) as unknown as Record<string, unknown>[]).map((s) => {
    const auteur = premier(
      s.auteur as Record<string, unknown> | Record<string, unknown>[] | null
    );
    return {
      id: s.id as string,
      type: s.type as TypeSuivi,
      description: s.description as string,
      dateEvenement: s.date_evenement as string,
      auteurNom: (auteur?.nom_complet as string | null) ?? null,
      creeLe: s.cree_le as string,
    };
  });
}

/**
 * Fiche détail d'une mise en relation, journal de suivi inclus. Renvoie null si
 * absente, supprimée, ou hors agence (RLS).
 */
export async function getMiseEnRelationById(
  id: string
): Promise<MiseEnRelationDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mises_en_relation")
    .select(
      "id, demande_id, partenaire_id, sens, statut, bien_propose, bien_id, " +
        "commission_totale, part_agence, part_partenaire, commission_percue, " +
        "date_soumission, date_conclusion, cree_le, " +
        "demande:demandes(contact:contacts(nom_complet, telephone)), " +
        "partenaire:partenaires(nom, type), " +
        "bien:biens(reference, titre)"
    )
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Lecture de la mise en relation impossible : ${error.message}`);
  }
  if (!data) return null;

  const m = data as unknown as Record<string, unknown>;
  const demande = premier(
    m.demande as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const client = premier(
    demande?.contact as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const partenaire = premier(
    m.partenaire as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const bien = premier(
    m.bien as Record<string, unknown> | Record<string, unknown>[] | null
  );

  const suivi = await getSuivi(supabase, id);

  return {
    id: m.id as string,
    demandeId: (m.demande_id as string | null) ?? null,
    partenaireId: m.partenaire_id as string,
    sens: m.sens as SensMiseEnRelation,
    statut: m.statut as StatutMiseEnRelation,
    clientNom: (client?.nom_complet as string) ?? "",
    clientTelephone: (client?.telephone as string) ?? "",
    partenaireNom: (partenaire?.nom as string) ?? "",
    partenaireType: (partenaire?.type as TypePartenaire) ?? "autre",
    bienPropose: (m.bien_propose as string | null) ?? null,
    bienId: (m.bien_id as string | null) ?? null,
    bienReference: (bien?.reference as string | null) ?? null,
    bienTitre: (bien?.titre as string | null) ?? null,
    commissionTotale: (m.commission_totale as number | null) ?? null,
    partAgence: (m.part_agence as number | null) ?? null,
    partPartenaire: (m.part_partenaire as number | null) ?? null,
    commissionPercue: (m.commission_percue as number | null) ?? null,
    dateSoumission: m.date_soumission as string,
    dateConclusion: (m.date_conclusion as string | null) ?? null,
    creeLe: m.cree_le as string,
    suivi,
  };
}
