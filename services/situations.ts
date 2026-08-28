import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  ProprietaireOption,
  SituationLigne,
  SituationProprietaire,
} from "@/types/situation";

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

/**
 * Propriétaires ayant au moins un bail (via biens.proprietaire_id), dédoublonnés
 * et triés par nom. RLS : cloisonné à l'agence.
 */
export async function getProprietairesAvecBaux(): Promise<ProprietaireOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("baux")
    .select("biens(proprietaire:contacts!proprietaire_id(id, nom_complet))")
    .is("supprime_le", null);

  if (error) throw new Error(`Lecture des propriétaires impossible : ${error.message}`);

  const parId = new Map<string, ProprietaireOption>();
  ((data ?? []) as unknown as Record<string, unknown>[]).forEach((row) => {
    const bien = premier(
      row.biens as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const proprio = premier(
      bien?.proprietaire as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const id = proprio?.id as string | undefined;
    if (id && !parId.has(id)) {
      parId.set(id, { id, nomComplet: (proprio?.nom_complet as string) ?? "" });
    }
  });

  return [...parId.values()].sort((a, b) =>
    a.nomComplet.localeCompare(b.nomComplet, "fr")
  );
}

/**
 * Situation locative d'un propriétaire pour un mois : une ligne par bail (donc
 * par locataire) avec loyer dû, encaissé, commission, net reversé et reste à
 * reverser, plus les totaux. Un propriétaire peut avoir plusieurs biens gérés.
 * Ne retient que les baux ayant une échéance OU un reversement sur le mois.
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

  const base: SituationProprietaire = {
    proprietaireId,
    proprietaireNom: (proprio.nom_complet as string) ?? "",
    proprietaireTelephone: (proprio.telephone as string) ?? "",
    mois,
    lignes: [],
    totaux: { loyerDu: 0, encaisse: 0, commission: 0, reverse: 0, reste: 0 },
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

  // Baux sur ces biens.
  const { data: baux } = await supabase
    .from("baux")
    .select("id, bien_id, locataire:contacts(nom_complet)")
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

  // Reversements du mois pour ces baux (agrégés par bail).
  const { data: revs } = await supabase
    .from("reversements")
    .select("bail_id, commission, montant_reverse")
    .in("bail_id", bailIds)
    .eq("periode", periode)
    .is("supprime_le", null);

  const revMap = new Map<string, { commission: number; reverse: number }>();
  (revs ?? []).forEach((r) => {
    const id = r.bail_id as string;
    const acc = revMap.get(id) ?? { commission: 0, reverse: 0 };
    acc.commission += (r.commission as number) ?? 0;
    acc.reverse += (r.montant_reverse as number) ?? 0;
    revMap.set(id, acc);
  });

  // Une ligne par bail concerné par le mois.
  const lignes: SituationLigne[] = [];
  (baux ?? []).forEach((bail) => {
    const id = bail.id as string;
    const ech = echMap.get(id);
    const rev = revMap.get(id);
    if (!ech && !rev) return; // rien ce mois-ci sur ce bail

    const locataire = premier(
      bail.locataire as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const bien = bienMap.get(bail.bien_id as string);
    const loyerDu = ech?.du ?? 0;
    const encaisse = ech?.regle ?? 0;
    const commission = rev?.commission ?? 0;
    const reverse = rev?.reverse ?? 0;
    const reste = Math.max(0, encaisse - commission - reverse);

    lignes.push({
      bailId: id,
      bienReference: bien?.reference ?? "",
      bienTitre: bien?.titre ?? null,
      locataireNom: (locataire?.nom_complet as string) ?? "",
      loyerDu,
      encaisse,
      commission,
      reverse,
      reste,
    });
  });

  lignes.sort((a, b) => a.bienReference.localeCompare(b.bienReference, "fr"));

  const totaux = lignes.reduce(
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

  return { ...base, lignes, totaux };
}
