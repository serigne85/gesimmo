import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  commissionSuggeree,
  montantReverse,
  type ReversementProprietaire,
} from "@/types/reversement";
import type { CommissionUnite } from "@/types/mandat";
import type {
  SituationLigne,
  SituationProprietaire,
  SituationTotaux,
} from "@/types/situation";

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

/** Commission de gérance sur le loyer réellement encaissé (0 si rien encaissé). */
function commissionLigne(
  encaisse: number,
  valeur: number | null,
  unite: CommissionUnite | null
): number {
  if (encaisse <= 0) return 0;
  return commissionSuggeree(encaisse, valeur, unite);
}

/**
 * Construit une ligne de situation (un bail). `reverse` = net à reverser de la
 * ligne (encaissé − commission) ; le suivi du reversement effectif est porté au
 * niveau du propriétaire (`SituationProprietaire.reversement`), d'où `reste = 0`.
 */
function construireLigne(p: {
  bailId: string;
  bienReference: string;
  bienTitre: string | null;
  locataireNom: string;
  loyerDu: number;
  encaisse: number;
  commissionValeur: number | null;
  commissionUnite: CommissionUnite | null;
}): SituationLigne {
  const commission = commissionLigne(p.encaisse, p.commissionValeur, p.commissionUnite);
  return {
    bailId: p.bailId,
    bienReference: p.bienReference,
    bienTitre: p.bienTitre,
    locataireNom: p.locataireNom,
    loyerDu: p.loyerDu,
    encaisse: p.encaisse,
    commission,
    reverse: montantReverse(p.encaisse, commission),
    reste: 0,
  };
}

/** Additionne les lignes en totaux de situation. */
function totaliser(lignes: SituationLigne[]): SituationTotaux {
  return lignes.reduce(
    (acc, l) => {
      acc.loyerDu += l.loyerDu;
      acc.encaisse += l.encaisse;
      acc.commission += l.commission;
      acc.reverse += l.reverse;
      acc.reste += l.reste;
      return acc;
    },
    { loyerDu: 0, encaisse: 0, commission: 0, reverse: 0, reste: 0 }
  );
}

/** Mappe une ligne SQL de reversement (grain propriétaire) en objet métier. */
function mapReversement(r: Record<string, unknown>): ReversementProprietaire {
  return {
    id: r.id as string,
    periode: r.periode as string,
    montantLoyer: (r.montant_loyer as number) ?? 0,
    commission: (r.commission as number) ?? 0,
    montantReverse: (r.montant_reverse as number) ?? 0,
    dateReversement: r.date_reversement as string,
    mode: r.mode as ReversementProprietaire["mode"],
    note: (r.note as string | null) ?? null,
  };
}

const SELECT_REVERSEMENT =
  "id, periode, montant_loyer, commission, montant_reverse, date_reversement, mode, note";

/**
 * Situation locative d'un propriétaire pour un mois : une ligne par bail (donc
 * par locataire) avec loyer dû, encaissé, commission suggérée et net à reverser,
 * plus les totaux et le reversement enregistré du mois (indicateur « reversé »).
 * Ne retient que les baux ayant une échéance sur le mois.
 */
export async function getSituationProprietaire(
  proprietaireId: string,
  mois: string
): Promise<SituationProprietaire | null> {
  const supabase = await createClient();
  const periode = `${mois}-01`;

  const { data: proprio } = await supabase
    .from("contacts")
    .select("nom_complet, telephone")
    .eq("id", proprietaireId)
    .is("supprime_le", null)
    .maybeSingle();

  if (!proprio) return null;

  // Reversement du mois (grain propriétaire), s'il existe.
  const { data: rev } = await supabase
    .from("reversements")
    .select(SELECT_REVERSEMENT)
    .eq("proprietaire_id", proprietaireId)
    .eq("periode", periode)
    .is("supprime_le", null)
    .maybeSingle();
  const reversement = rev ? mapReversement(rev as Record<string, unknown>) : null;

  const base: SituationProprietaire = {
    proprietaireId,
    proprietaireNom: (proprio.nom_complet as string) ?? "",
    proprietaireTelephone: (proprio.telephone as string) ?? "",
    mois,
    lignes: [],
    totaux: { loyerDu: 0, encaisse: 0, commission: 0, reverse: 0, reste: 0 },
    reversement,
  };

  // Biens du propriétaire.
  const { data: biens } = await supabase
    .from("biens")
    .select("id, reference, titre")
    .eq("proprietaire_id", proprietaireId)
    .is("supprime_le", null);

  const bienMap = new Map<string, { reference: string; titre: string | null }>();
  (biens ?? []).forEach((b) =>
    bienMap.set(b.id as string, {
      reference: (b.reference as string) ?? "",
      titre: (b.titre as string | null) ?? null,
    })
  );
  const bienIds = [...bienMap.keys()];
  if (bienIds.length === 0) return base;

  // Baux sur ces biens (+ locataire + commission du mandat de gérance).
  const { data: baux } = await supabase
    .from("baux")
    .select(
      "id, bien_id, locataire:contacts(nom_complet), mandats(commission_valeur, commission_unite)"
    )
    .in("bien_id", bienIds)
    .is("supprime_le", null);

  const bailIds = (baux ?? []).map((b) => b.id as string);
  if (bailIds.length === 0) return base;

  // Échéances du mois pour ces baux.
  const { data: echs } = await supabase
    .from("echeances_loyer")
    .select("bail_id, montant_du, montant_regle")
    .in("bail_id", bailIds)
    .eq("periode", periode);

  const echMap = new Map<string, { du: number; regle: number }>();
  (echs ?? []).forEach((e) =>
    echMap.set(e.bail_id as string, {
      du: (e.montant_du as number) ?? 0,
      regle: (e.montant_regle as number) ?? 0,
    })
  );

  const lignes: SituationLigne[] = [];
  (baux ?? []).forEach((bail) => {
    const ech = echMap.get(bail.id as string);
    if (!ech) return; // rien encaissé/dû ce mois-ci sur ce bail
    const locataire = premier(
      bail.locataire as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const mandat = premier(
      bail.mandats as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const bien = bienMap.get(bail.bien_id as string);
    lignes.push(
      construireLigne({
        bailId: bail.id as string,
        bienReference: bien?.reference ?? "",
        bienTitre: bien?.titre ?? null,
        locataireNom: (locataire?.nom_complet as string) ?? "",
        loyerDu: ech.du,
        encaisse: ech.regle,
        commissionValeur: (mandat?.commission_valeur as number | null) ?? null,
        commissionUnite: (mandat?.commission_unite as CommissionUnite | null) ?? null,
      })
    );
  });

  lignes.sort((a, b) => a.bienReference.localeCompare(b.bienReference, "fr"));

  return { ...base, lignes, totaux: totaliser(lignes), reversement };
}

/**
 * Situations de tous les propriétaires pour un mois (Paiements ▸ Par
 * propriétaire) : une entrée par propriétaire ayant un loyer ce mois-ci OU un
 * reversement enregistré. Requêtes groupées (pas de boucle par propriétaire).
 */
export async function getSituationsMois(
  mois: string
): Promise<SituationProprietaire[]> {
  const supabase = await createClient();
  const periode = `${mois}-01`;

  // Tous les baux vivants + bien, propriétaire, locataire, commission du mandat.
  const { data: baux, error } = await supabase
    .from("baux")
    .select(
      "id, bien_id, locataire:contacts(nom_complet), " +
        "mandats(commission_valeur, commission_unite), " +
        "biens(reference, titre, proprietaire:contacts!proprietaire_id(id, nom_complet, telephone))"
    )
    .is("supprime_le", null);

  if (error) throw new Error(`Lecture des situations impossible : ${error.message}`);

  const bauxRows = (baux ?? []) as unknown as Record<string, unknown>[];
  const bailIds = bauxRows.map((b) => b.id as string);

  // Échéances du mois + reversements du mois (grain propriétaire).
  const [echRes, revRes] = await Promise.all([
    bailIds.length
      ? supabase
          .from("echeances_loyer")
          .select("bail_id, montant_du, montant_regle")
          .in("bail_id", bailIds)
          .eq("periode", periode)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    supabase
      .from("reversements")
      .select(`proprietaire_id, ${SELECT_REVERSEMENT}`)
      .eq("periode", periode)
      .is("supprime_le", null),
  ]);

  const echMap = new Map<string, { du: number; regle: number }>();
  ((echRes.data ?? []) as Record<string, unknown>[]).forEach((e) =>
    echMap.set(e.bail_id as string, {
      du: (e.montant_du as number) ?? 0,
      regle: (e.montant_regle as number) ?? 0,
    })
  );

  const revMap = new Map<string, ReversementProprietaire>();
  ((revRes.data ?? []) as Record<string, unknown>[]).forEach((r) =>
    revMap.set(r.proprietaire_id as string, mapReversement(r))
  );

  // Regrouper les lignes par propriétaire.
  type Groupe = {
    proprietaireId: string;
    proprietaireNom: string;
    proprietaireTelephone: string;
    lignes: SituationLigne[];
  };
  const groupes = new Map<string, Groupe>();

  bauxRows.forEach((bail) => {
    const ech = echMap.get(bail.id as string);
    if (!ech) return; // pas de loyer ce mois-ci sur ce bail
    const bien = premier(
      bail.biens as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const proprio = premier(
      bien?.proprietaire as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const proprietaireId = proprio?.id as string | undefined;
    if (!proprietaireId) return;

    const locataire = premier(
      bail.locataire as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const mandat = premier(
      bail.mandats as Record<string, unknown> | Record<string, unknown>[] | null
    );

    const groupe =
      groupes.get(proprietaireId) ??
      {
        proprietaireId,
        proprietaireNom: (proprio?.nom_complet as string) ?? "",
        proprietaireTelephone: (proprio?.telephone as string) ?? "",
        lignes: [],
      };
    groupe.lignes.push(
      construireLigne({
        bailId: bail.id as string,
        bienReference: (bien?.reference as string) ?? "",
        bienTitre: (bien?.titre as string | null) ?? null,
        locataireNom: (locataire?.nom_complet as string) ?? "",
        loyerDu: ech.du,
        encaisse: ech.regle,
        commissionValeur: (mandat?.commission_valeur as number | null) ?? null,
        commissionUnite: (mandat?.commission_unite as CommissionUnite | null) ?? null,
      })
    );
    groupes.set(proprietaireId, groupe);
  });

  // Propriétaires ayant un reversement mais aucune ligne ce mois-ci (cas limite :
  // échéance supprimée après coup). On récupère leur nom pour les afficher.
  const idsManquants = [...revMap.keys()].filter((id) => !groupes.has(id));
  if (idsManquants.length > 0) {
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, nom_complet, telephone")
      .in("id", idsManquants);
    ((contacts ?? []) as Record<string, unknown>[]).forEach((c) =>
      groupes.set(c.id as string, {
        proprietaireId: c.id as string,
        proprietaireNom: (c.nom_complet as string) ?? "",
        proprietaireTelephone: (c.telephone as string) ?? "",
        lignes: [],
      })
    );
  }

  const situations: SituationProprietaire[] = [...groupes.values()].map((g) => {
    g.lignes.sort((a, b) => a.bienReference.localeCompare(b.bienReference, "fr"));
    return {
      proprietaireId: g.proprietaireId,
      proprietaireNom: g.proprietaireNom,
      proprietaireTelephone: g.proprietaireTelephone,
      mois,
      lignes: g.lignes,
      totaux: totaliser(g.lignes),
      reversement: revMap.get(g.proprietaireId) ?? null,
    };
  });

  return situations.sort((a, b) =>
    a.proprietaireNom.localeCompare(b.proprietaireNom, "fr")
  );
}
