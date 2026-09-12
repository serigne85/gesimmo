import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  OBJECTIF_LABELS,
  STATUT_BIEN_LABELS,
  TYPE_BIEN_LABELS,
  type ObjectifBien,
  type StatutBien,
  type TypeBien,
} from "@/types/bien";
import {
  bornesPeriode,
  type RapportPeriode,
  type RepartitionLigne,
  type Rapports,
} from "@/types/rapport";

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

/** Répartition triée par effectif décroissant, segments vides exclus. */
function repartition(
  compte: Map<string, number>,
  label: (cle: string) => string
): RepartitionLigne[] {
  return [...compte.entries()]
    .filter(([, n]) => n > 0)
    .map(([cle, nombre]) => ({ cle, label: label(cle), nombre }))
    .sort((a, b) => b.nombre - a.nombre);
}

/**
 * Rapports de direction pour une période (mois inclusifs). Toutes les requêtes
 * partent en parallèle (RLS cloisonnée par agence). Aucune écriture : on ne fait
 * que lire et agréger. Le portefeuille est une photo à l'instant présent ;
 * activité, recouvrement et commissions portent sur la période.
 */
export async function getRapports(periode: RapportPeriode): Promise<Rapports> {
  const supabase = await createClient();
  const { dateDebut, finExclusif } = bornesPeriode(periode);

  const [
    biensRes,
    biensRentresRes,
    mandatsRes,
    bauxRes,
    visitesRes,
    echeancesRes,
    reversementsRes,
    apportsRes,
  ] = await Promise.all([
    // Portefeuille (photo) : biens vivants avec objectif/statut/type/zone.
    supabase
      .from("biens")
      .select("objectif, statut, type, zones(nom)")
      .is("supprime_le", null),
    // Activité : biens rentrés sur la période.
    supabase
      .from("biens")
      .select("id", { count: "exact", head: true })
      .gte("cree_le", dateDebut)
      .lt("cree_le", finExclusif)
      .is("supprime_le", null),
    // Mandats signés : date d'effet dans la période, hors brouillon/attente.
    supabase
      .from("mandats")
      .select("id", { count: "exact", head: true })
      .not("statut", "in", "(brouillon,en_attente_signature)")
      .gte("date_debut", dateDebut)
      .lt("date_debut", finExclusif)
      .is("supprime_le", null),
    // Baux enregistrés sur la période.
    supabase
      .from("baux")
      .select("id", { count: "exact", head: true })
      .gte("cree_le", dateDebut)
      .lt("cree_le", finExclusif)
      .is("supprime_le", null),
    // Visites réalisées sur la période.
    supabase
      .from("rendez_vous")
      .select("id", { count: "exact", head: true })
      .eq("type", "visite")
      .eq("statut", "realise")
      .gte("debut", dateDebut)
      .lt("debut", finExclusif)
      .is("supprime_le", null),
    // Recouvrement : échéances dont le mois tombe dans la période.
    supabase
      .from("echeances_loyer")
      .select("montant_du, montant_regle, statut")
      .gte("periode", dateDebut)
      .lt("periode", finExclusif),
    // Commissions de gérance encaissées sur la période.
    supabase
      .from("reversements")
      .select("commission")
      .gte("periode", dateDebut)
      .lt("periode", finExclusif)
      .is("supprime_le", null),
    // Apports d'affaires : commission perçue sur affaires conclues dans la période.
    supabase
      .from("mises_en_relation")
      .select("commission_percue")
      .eq("statut", "conclue")
      .gte("date_conclusion", dateDebut)
      .lt("date_conclusion", finExclusif)
      .is("supprime_le", null),
  ]);

  for (const res of [
    biensRes,
    biensRentresRes,
    mandatsRes,
    bauxRes,
    visitesRes,
    echeancesRes,
    reversementsRes,
    apportsRes,
  ]) {
    if (res.error) throw new Error(`Lecture des rapports impossible : ${res.error.message}`);
  }

  // --- Portefeuille (photo) ---
  const biens = (biensRes.data ?? []) as unknown as Record<string, unknown>[];
  const parObjectif = new Map<string, number>();
  const parStatut = new Map<string, number>();
  const parType = new Map<string, number>();
  const parZone = new Map<string, number>();
  for (const b of biens) {
    const objectif = b.objectif as string;
    const statut = b.statut as string;
    const type = b.type as string;
    const zone = premier(
      b.zones as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const zoneNom = (zone?.nom as string) ?? "Sans zone";
    parObjectif.set(objectif, (parObjectif.get(objectif) ?? 0) + 1);
    parStatut.set(statut, (parStatut.get(statut) ?? 0) + 1);
    parType.set(type, (parType.get(type) ?? 0) + 1);
    parZone.set(zoneNom, (parZone.get(zoneNom) ?? 0) + 1);
  }

  // --- Recouvrement ---
  const echeances = (echeancesRes.data ?? []) as {
    montant_du: number | null;
    montant_regle: number | null;
    statut: string;
  }[];
  let du = 0;
  let encaisse = 0;
  let nbImpayees = 0;
  for (const e of echeances) {
    du += e.montant_du ?? 0;
    encaisse += e.montant_regle ?? 0;
    if (e.statut !== "paye") nbImpayees += 1;
  }
  const taux = du > 0 ? Math.round((encaisse / du) * 100) : 0;

  // --- Commissions ---
  const gerance = ((reversementsRes.data ?? []) as { commission: number | null }[]).reduce(
    (s, r) => s + (r.commission ?? 0),
    0
  );
  const apports = (
    (apportsRes.data ?? []) as { commission_percue: number | null }[]
  ).reduce((s, m) => s + (m.commission_percue ?? 0), 0);

  return {
    periode,
    portefeuille: {
      total: biens.length,
      parObjectif: repartition(parObjectif, (c) => OBJECTIF_LABELS[c as ObjectifBien] ?? c),
      parStatut: repartition(parStatut, (c) => STATUT_BIEN_LABELS[c as StatutBien] ?? c),
      parType: repartition(parType, (c) => TYPE_BIEN_LABELS[c as TypeBien] ?? c),
      parZone: repartition(parZone, (c) => c),
    },
    activite: {
      biensRentres: biensRentresRes.count ?? 0,
      mandatsSignes: mandatsRes.count ?? 0,
      bauxEnregistres: bauxRes.count ?? 0,
      visitesRealisees: visitesRes.count ?? 0,
    },
    recouvrement: {
      du,
      encaisse,
      reste: du - encaisse,
      taux,
      nbEcheances: echeances.length,
      nbImpayees,
    },
    commissions: {
      gerance,
      apports,
      total: gerance + apports,
    },
  };
}
