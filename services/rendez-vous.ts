import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  RendezVousListe,
  RendezVousDetail,
  CompteRenduVisite,
  TypeRendezVous,
  StatutRendezVous,
  NiveauInteret,
} from "@/types/rendez-vous";

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

export type FiltresRendezVous = {
  du?: string; // borne basse (ISO) incluse
  au?: string; // borne haute (ISO) incluse
  statut?: StatutRendezVous;
  type?: TypeRendezVous;
  assigneeId?: string;
};

/**
 * Rendez-vous de l'agence (RLS cloisonnée), triés par début croissant. Le
 * client, le bien et l'assigné sont joints. Fenêtre de dates optionnelle.
 */
export async function listRendezVous(
  filtres: FiltresRendezVous = {}
): Promise<RendezVousListe[]> {
  const supabase = await createClient();

  let query = supabase
    .from("rendez_vous")
    .select(
      "id, titre, type, statut, debut, fin, lieu, " +
        "contact:contacts(nom_complet), bien:biens(reference), " +
        "assignee:utilisateurs!rendez_vous_assignee_id_fkey(nom_complet)"
    )
    .is("supprime_le", null);

  if (filtres.du) query = query.gte("debut", filtres.du);
  if (filtres.au) query = query.lte("debut", filtres.au);
  if (filtres.statut) query = query.eq("statut", filtres.statut);
  if (filtres.type) query = query.eq("type", filtres.type);
  if (filtres.assigneeId) query = query.eq("assignee_id", filtres.assigneeId);

  const { data, error } = await query.order("debut", { ascending: true });
  if (error) {
    throw new Error(`Lecture des rendez-vous impossible : ${error.message}`);
  }

  return ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => {
    const contact = premier(
      r.contact as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const bien = premier(
      r.bien as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const assignee = premier(
      r.assignee as Record<string, unknown> | Record<string, unknown>[] | null
    );
    return {
      id: r.id as string,
      titre: r.titre as string,
      type: r.type as TypeRendezVous,
      statut: r.statut as StatutRendezVous,
      debut: r.debut as string,
      fin: (r.fin as string | null) ?? null,
      lieu: (r.lieu as string | null) ?? null,
      contactNom: (contact?.nom_complet as string | null) ?? null,
      bienReference: (bien?.reference as string | null) ?? null,
      assigneeNom: (assignee?.nom_complet as string | null) ?? null,
    };
  });
}

/**
 * Fiche détail d'un rendez-vous, compte rendu de visite inclus s'il existe.
 * Renvoie null si absent, supprimé, ou hors agence (RLS).
 */
export async function getRendezVousById(
  id: string
): Promise<RendezVousDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rendez_vous")
    .select(
      "id, titre, type, statut, debut, fin, lieu, notes, cree_le, " +
        "contact_id, bien_id, assignee_id, " +
        "contact:contacts(nom_complet, telephone), bien:biens(reference), " +
        "assignee:utilisateurs!rendez_vous_assignee_id_fkey(nom_complet)"
    )
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Lecture du rendez-vous impossible : ${error.message}`);
  }
  if (!data) return null;

  const r = data as unknown as Record<string, unknown>;
  const contact = premier(
    r.contact as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const bien = premier(
    r.bien as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const assignee = premier(
    r.assignee as Record<string, unknown> | Record<string, unknown>[] | null
  );

  const compteRendu = await getCompteRendu(supabase, id);

  return {
    id: r.id as string,
    titre: r.titre as string,
    type: r.type as TypeRendezVous,
    statut: r.statut as StatutRendezVous,
    debut: r.debut as string,
    fin: (r.fin as string | null) ?? null,
    lieu: (r.lieu as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
    contactId: (r.contact_id as string | null) ?? null,
    contactNom: (contact?.nom_complet as string | null) ?? null,
    contactTelephone: (contact?.telephone as string | null) ?? null,
    bienId: (r.bien_id as string | null) ?? null,
    bienReference: (bien?.reference as string | null) ?? null,
    assigneeId: (r.assignee_id as string | null) ?? null,
    assigneeNom: (assignee?.nom_complet as string | null) ?? null,
    creeLe: r.cree_le as string,
    compteRendu,
  };
}

/** Compte rendu d'une visite (ou null). */
async function getCompteRendu(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rendezVousId: string
): Promise<CompteRenduVisite | null> {
  const { data, error } = await supabase
    .from("comptes_rendus_visite")
    .select(
      "id, interesse, niveau_interet, compte_rendu, suite_a_donner, cree_le, maj_le"
    )
    .eq("rendez_vous_id", rendezVousId)
    .maybeSingle();

  if (error) {
    throw new Error(`Lecture du compte rendu impossible : ${error.message}`);
  }
  if (!data) return null;

  return {
    id: data.id as string,
    interesse: (data.interesse as boolean | null) ?? null,
    niveauInteret: (data.niveau_interet as NiveauInteret | null) ?? null,
    compteRendu: data.compte_rendu as string,
    suiteADonner: (data.suite_a_donner as string | null) ?? null,
    creeLe: data.cree_le as string,
    majLe: data.maj_le as string,
  };
}
