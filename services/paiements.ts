import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type {
  EcheanceDetail,
  Paiement,
  PaiementRecu,
  QuittanceData,
} from "@/types/paiement";

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

/**
 * Recalcule le statut d'une échéance à partir de ses paiements non supprimés, et
 * met à jour le cache `montant_regle`. C'est LA règle CLAUDE.md : le statut d'une
 * échéance ne se saisit jamais, il se déduit des paiements. Appelé après chaque
 * enregistrement ou annulation de paiement (client de session, RLS active).
 */
export async function recalculerStatutEcheance(
  supabase: SupabaseClient,
  echeanceId: string
): Promise<void> {
  const { data: ech } = await supabase
    .from("echeances_loyer")
    .select("montant_du")
    .eq("id", echeanceId)
    .maybeSingle();
  if (!ech) return;

  const { data: pais } = await supabase
    .from("paiements")
    .select("montant")
    .eq("echeance_id", echeanceId)
    .is("supprime_le", null);

  const total = (pais ?? []).reduce(
    (s, p) => s + ((p.montant as number) ?? 0),
    0
  );
  const du = ech.montant_du as number;
  const statut = total >= du ? "paye" : total > 0 ? "partiel" : "impaye";

  await supabase
    .from("echeances_loyer")
    .update({ statut, montant_regle: total })
    .eq("id", echeanceId);
}

/** Paiements non supprimés d'une échéance, du plus ancien au plus récent. */
async function getPaiements(
  supabase: SupabaseClient,
  echeanceId: string
): Promise<Paiement[]> {
  const { data, error } = await supabase
    .from("paiements")
    .select(
      "id, montant, date_paiement, mode, reference_transaction, note, cree_le, encaisse:utilisateurs(nom_complet)"
    )
    .eq("echeance_id", echeanceId)
    .is("supprime_le", null)
    .order("date_paiement", { ascending: true });

  if (error) throw new Error(`Lecture des paiements impossible : ${error.message}`);

  const lignes = (data ?? []) as unknown as Record<string, unknown>[];
  return lignes.map((p) => {
    const encaisse = premier(
      p.encaisse as Record<string, unknown> | Record<string, unknown>[] | null
    );
    return {
      id: p.id as string,
      montant: (p.montant as number) ?? 0,
      datePaiement: p.date_paiement as string,
      mode: p.mode as Paiement["mode"],
      referenceTransaction: (p.reference_transaction as string | null) ?? null,
      note: (p.note as string | null) ?? null,
      encaisseParNom: (encaisse?.nom_complet as string) ?? null,
      creeLe: p.cree_le as string,
    };
  });
}

/** Fiche d'une échéance pour l'écran d'encaissement (contexte + paiements). */
export async function getEcheanceDetail(
  id: string
): Promise<EcheanceDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("echeances_loyer")
    .select(
      "id, bail_id, periode, date_echeance, montant_du, montant_regle, statut, baux(reference, biens(reference, titre), locataire:contacts(nom_complet, telephone))"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Lecture de l'échéance impossible : ${error.message}`);
  if (!data) return null;

  const e = data as unknown as Record<string, unknown>;
  const bail = premier(
    e.baux as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const bien = premier(
    bail?.biens as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const locataire = premier(
    bail?.locataire as Record<string, unknown> | Record<string, unknown>[] | null
  );

  const paiements = await getPaiements(supabase, id);

  return {
    id: e.id as string,
    bailId: e.bail_id as string,
    periode: e.periode as string,
    dateEcheance: e.date_echeance as string,
    montantDu: (e.montant_du as number) ?? 0,
    montantRegle: (e.montant_regle as number) ?? 0,
    statut: e.statut as EcheanceDetail["statut"],
    bailReference: (bail?.reference as string) ?? "",
    bienReference: (bien?.reference as string) ?? "",
    bienTitre: (bien?.titre as string | null) ?? null,
    locataireNom: (locataire?.nom_complet as string) ?? "",
    locataireTelephone: (locataire?.telephone as string) ?? "",
    paiements,
  };
}

/**
 * Données d'une quittance de loyer pour une échéance. Agrège le contexte (agence
 * émettrice, bail, bien, locataire), le détail loyer/charges et la date du
 * dernier paiement. C'est la page qui vérifie que l'échéance est soldée.
 */
export async function getQuittance(
  echeanceId: string
): Promise<QuittanceData | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("echeances_loyer")
    .select(
      "id, periode, montant_du, montant_regle, statut, agences(nom, ville), baux(reference, loyer_mensuel, charges_mensuelles, biens(reference, titre, adresse), locataire:contacts(nom_complet))"
    )
    .eq("id", echeanceId)
    .maybeSingle();

  if (error) throw new Error(`Lecture de la quittance impossible : ${error.message}`);
  if (!data) return null;

  const e = data as unknown as Record<string, unknown>;
  const agence = premier(
    e.agences as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const bail = premier(
    e.baux as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const bien = premier(
    bail?.biens as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const locataire = premier(
    bail?.locataire as Record<string, unknown> | Record<string, unknown>[] | null
  );

  // Date du dernier paiement encaissé (non supprimé) sur cette échéance.
  const { data: dernier } = await supabase
    .from("paiements")
    .select("date_paiement")
    .eq("echeance_id", echeanceId)
    .is("supprime_le", null)
    .order("date_paiement", { ascending: false })
    .limit(1)
    .maybeSingle();

  const loyer = (bail?.loyer_mensuel as number) ?? 0;
  const charges = (bail?.charges_mensuelles as number) ?? 0;

  return {
    echeanceId: e.id as string,
    periode: e.periode as string,
    statut: e.statut as QuittanceData["statut"],
    loyer,
    charges,
    total: (e.montant_du as number) ?? loyer + charges,
    regle: (e.montant_regle as number) ?? 0,
    agenceNom: (agence?.nom as string) ?? "",
    agenceVille: (agence?.ville as string | null) ?? null,
    bailReference: (bail?.reference as string) ?? "",
    bienReference: (bien?.reference as string) ?? "",
    bienTitre: (bien?.titre as string | null) ?? null,
    bienAdresse: (bien?.adresse as string | null) ?? null,
    locataireNom: (locataire?.nom_complet as string) ?? "",
    derniereDatePaiement: (dernier?.date_paiement as string | null) ?? null,
  };
}

/** Données figées d'un reçu de paiement (pour l'impression). */
export async function getRecu(paiementId: string): Promise<PaiementRecu | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("paiements")
    .select(
      "id, montant, date_paiement, mode, reference_transaction, agences(nom), encaisse:utilisateurs(nom_complet), echeances_loyer(periode, montant_du, montant_regle, baux(reference, biens(reference, titre), locataire:contacts(nom_complet)))"
    )
    .eq("id", paiementId)
    .is("supprime_le", null)
    .maybeSingle();

  if (error) throw new Error(`Lecture du reçu impossible : ${error.message}`);
  if (!data) return null;

  const p = data as unknown as Record<string, unknown>;
  const agence = premier(
    p.agences as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const encaisse = premier(
    p.encaisse as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const echeance = premier(
    p.echeances_loyer as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const bail = premier(
    echeance?.baux as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const bien = premier(
    bail?.biens as Record<string, unknown> | Record<string, unknown>[] | null
  );
  const locataire = premier(
    bail?.locataire as Record<string, unknown> | Record<string, unknown>[] | null
  );

  return {
    id: p.id as string,
    montant: (p.montant as number) ?? 0,
    datePaiement: p.date_paiement as string,
    mode: p.mode as PaiementRecu["mode"],
    referenceTransaction: (p.reference_transaction as string | null) ?? null,
    encaisseParNom: (encaisse?.nom_complet as string) ?? null,
    agenceNom: (agence?.nom as string) ?? "",
    bailReference: (bail?.reference as string) ?? "",
    periode: (echeance?.periode as string) ?? "",
    bienReference: (bien?.reference as string) ?? "",
    bienTitre: (bien?.titre as string | null) ?? null,
    locataireNom: (locataire?.nom_complet as string) ?? "",
    resteMois: Math.max(
      0,
      ((echeance?.montant_du as number) ?? 0) -
        ((echeance?.montant_regle as number) ?? 0)
    ),
  };
}
