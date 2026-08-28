import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  ReversementLigne,
  ReversementGlobal,
  ReversementsMois,
} from "@/types/reversement";

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

/** Historique des reversements d'un bail (du plus récent au plus ancien, RLS). */
export async function listReversementsBail(
  bailId: string
): Promise<ReversementLigne[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reversements")
    .select(
      "id, periode, montant_loyer, commission, montant_reverse, date_reversement, mode, note"
    )
    .eq("bail_id", bailId)
    .is("supprime_le", null)
    .order("periode", { ascending: false });

  if (error) throw new Error(`Lecture des reversements impossible : ${error.message}`);

  const lignes = (data ?? []) as unknown as Record<string, unknown>[];
  return lignes.map((r) => ({
    id: r.id as string,
    periode: r.periode as string,
    montantLoyer: (r.montant_loyer as number) ?? 0,
    commission: (r.commission as number) ?? 0,
    montantReverse: (r.montant_reverse as number) ?? 0,
    dateReversement: r.date_reversement as string,
    mode: r.mode as ReversementLigne["mode"],
    note: (r.note as string | null) ?? null,
  }));
}

/**
 * Vue globale des reversements d'un mois (tous baux de l'agence), avec totaux.
 * RLS : cloisonné à l'agence. Trié du plus récent au plus ancien.
 */
export async function getReversements(mois: string): Promise<ReversementsMois> {
  const supabase = await createClient();
  const periode = `${mois}-01`;

  const { data, error } = await supabase
    .from("reversements")
    .select(
      "id, periode, montant_loyer, commission, montant_reverse, date_reversement, bail_id, baux(reference, biens(reference, titre)), proprietaire:contacts(nom_complet)"
    )
    .eq("periode", periode)
    .is("supprime_le", null)
    .order("date_reversement", { ascending: false });

  if (error) throw new Error(`Lecture des reversements impossible : ${error.message}`);

  const lignes = (data ?? []) as unknown as Record<string, unknown>[];
  const rows: ReversementGlobal[] = lignes.map((r) => {
    const bail = premier(
      r.baux as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const bien = premier(
      bail?.biens as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const proprietaire = premier(
      r.proprietaire as Record<string, unknown> | Record<string, unknown>[] | null
    );
    return {
      id: r.id as string,
      periode: r.periode as string,
      montantLoyer: (r.montant_loyer as number) ?? 0,
      commission: (r.commission as number) ?? 0,
      montantReverse: (r.montant_reverse as number) ?? 0,
      dateReversement: r.date_reversement as string,
      bailId: r.bail_id as string,
      bailReference: (bail?.reference as string) ?? "",
      bienReference: (bien?.reference as string) ?? "",
      bienTitre: (bien?.titre as string | null) ?? null,
      proprietaireNom: (proprietaire?.nom_complet as string) ?? "",
    };
  });

  const totaux = rows.reduce(
    (acc, r) => {
      acc.loyer += r.montantLoyer;
      acc.commission += r.commission;
      acc.reverse += r.montantReverse;
      return acc;
    },
    { loyer: 0, commission: 0, reverse: 0 }
  );

  return { mois, rows, totaux };
}
