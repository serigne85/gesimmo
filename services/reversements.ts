import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ReversementLigne } from "@/types/reversement";

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
