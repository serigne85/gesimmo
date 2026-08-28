import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BailListe, BienLouable, BailDetail } from "@/types/bail";

export const BAUX_PAGE_SIZE = 20;

export type BauxPage = {
  rows: BailListe[];
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
 * Liste paginée des baux de l'agence (RLS : cloisonné automatiquement).
 * Le bien et le locataire sont joints en une requête.
 */
export async function listBaux(page = 1): Promise<BauxPage> {
  const supabase = await createClient();
  const from = (page - 1) * BAUX_PAGE_SIZE;
  const to = from + BAUX_PAGE_SIZE - 1;

  const { data, count, error } = await supabase
    .from("baux")
    .select(
      "id, reference, statut, date_debut, date_fin, " +
        "loyer_mensuel, charges_mensuelles, " +
        "biens(reference, titre), " +
        "locataire:contacts(nom_complet, telephone)",
      { count: "exact" }
    )
    .is("supprime_le", null)
    .order("cree_le", { ascending: false })
    .range(from, to);

  if (error) throw new Error(`Lecture des baux impossible : ${error.message}`);

  const lignes = (data ?? []) as unknown as Record<string, unknown>[];
  const rows: BailListe[] = lignes.map((b) => {
    const bien = premier(
      b.biens as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const locataire = premier(
      b.locataire as Record<string, unknown> | Record<string, unknown>[] | null
    );

    return {
      id: b.id as string,
      reference: b.reference as string,
      statut: b.statut as BailListe["statut"],
      dateDebut: (b.date_debut as string | null) ?? null,
      dateFin: (b.date_fin as string | null) ?? null,
      loyerMensuel: (b.loyer_mensuel as number) ?? 0,
      chargesMensuelles: (b.charges_mensuelles as number) ?? 0,
      bienReference: (bien?.reference as string) ?? "",
      bienTitre: (bien?.titre as string | null) ?? null,
      locataireNom: (locataire?.nom_complet as string) ?? "",
      locataireTelephone: (locataire?.telephone as string) ?? "",
    };
  });

  return { rows, total: count ?? 0, page, pageSize: BAUX_PAGE_SIZE };
}

/**
 * Fiche complète d'un bail (RLS : forcément dans l'agence). Bien, locataire et
 * mandat éventuel sont joints en une requête. Renvoie null si introuvable.
 */
export async function getBailById(id: string): Promise<BailDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("baux")
    .select(
      "id, reference, statut, date_debut, date_fin, loyer_mensuel, " +
        "charges_mensuelles, caution_mois, jour_echeance, mode_paiement, " +
        "notes, cree_le, bien_id, mandat_id, " +
        "biens(reference, titre, statut), " +
        "locataire:contacts(nom_complet, telephone), " +
        "mandats(reference, type, commission_valeur, commission_unite)"
    )
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (error) throw new Error(`Lecture du bail impossible : ${error.message}`);
  if (!data) return null;

  const b = data as unknown as Record<string, unknown>;
  const bien = premier(
    b.biens as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const locataire = premier(
    b.locataire as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const mandat = premier(
    b.mandats as Record<string, unknown> | Record<string, unknown>[] | null
  );

  return {
    id: b.id as string,
    reference: b.reference as string,
    statut: b.statut as BailDetail["statut"],
    dateDebut: (b.date_debut as string | null) ?? null,
    dateFin: (b.date_fin as string | null) ?? null,
    loyerMensuel: (b.loyer_mensuel as number) ?? 0,
    chargesMensuelles: (b.charges_mensuelles as number) ?? 0,
    cautionMois: (b.caution_mois as number | null) ?? null,
    jourEcheance: (b.jour_echeance as number) ?? 1,
    modePaiement: (b.mode_paiement as BailDetail["modePaiement"]) ?? null,
    notes: (b.notes as string | null) ?? null,
    creeLe: b.cree_le as string,
    bienId: b.bien_id as string,
    bienReference: (bien?.reference as string) ?? "",
    bienTitre: (bien?.titre as string | null) ?? null,
    bienStatut: (bien?.statut as BailDetail["bienStatut"]) ?? "disponible",
    locataireNom: (locataire?.nom_complet as string) ?? "",
    locataireTelephone: (locataire?.telephone as string) ?? "",
    mandatId: (b.mandat_id as string | null) ?? null,
    mandatReference: (mandat?.reference as string) ?? null,
    mandatType: (mandat?.type as BailDetail["mandatType"]) ?? null,
    mandatCommissionValeur: (mandat?.commission_valeur as number | null) ?? null,
    mandatCommissionUnite:
      (mandat?.commission_unite as BailDetail["mandatCommissionUnite"]) ?? null,
  };
}

/**
 * Biens éligibles à un bail : objectif « location », non supprimés, dont le
 * statut n'est ni « loue » (déjà loué), ni « vendu », ni « archive ». Ça inclut
 * donc les biens « disponible » — un bien peut être disponible sans être encore
 * loué. Le passage effectif à « loue » se fera à l'activation du bail (étape 2).
 */
export async function listBiensLouables(): Promise<BienLouable[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("biens")
    .select("id, reference, titre, type")
    .eq("objectif", "location")
    .is("supprime_le", null)
    .not("statut", "in", "(loue,vendu,archive)")
    .order("cree_le", { ascending: false });

  if (error) throw new Error(`Lecture des biens impossible : ${error.message}`);

  const lignes = (data ?? []) as unknown as Record<string, unknown>[];
  return lignes.map((b) => ({
    id: b.id as string,
    reference: b.reference as string,
    titre: (b.titre as string | null) ?? null,
    type: b.type as BienLouable["type"],
  }));
}
