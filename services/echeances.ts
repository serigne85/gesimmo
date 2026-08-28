import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { EcheanceLoyer } from "@/types/echeance";

// Horizon généré pour un bail sans date de fin (durée indéterminée). On étendra
// plus tard via une automatisation ; 12 mois couvrent l'usage courant.
const HORIZON_MOIS = 12;

/** Champs d'un bail nécessaires pour générer ses échéances. */
export type BailPourEcheances = {
  id: string;
  dateDebut: string; // requis : l'activation d'un bail l'exige déjà
  dateFin: string | null;
  loyerMensuel: number;
  chargesMensuelles: number;
  jourEcheance: number;
};

/**
 * Liste des 1ers du mois (AAAA-MM-01) entre le mois de début et le mois de fin
 * inclus. Sans date de fin, on génère un horizon glissant de 12 mois. Calcul en
 * UTC pour éviter toute dérive de fuseau.
 */
function periodesMensuelles(debut: string, fin: string | null): string[] {
  const [dy, dm] = debut.split("-").map(Number);
  const start = new Date(Date.UTC(dy, dm - 1, 1));

  let end: Date;
  if (fin) {
    const [fy, fm] = fin.split("-").map(Number);
    end = new Date(Date.UTC(fy, fm - 1, 1));
  } else {
    end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + (HORIZON_MOIS - 1));
  }

  const periodes: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    periodes.push(cur.toISOString().slice(0, 10));
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  return periodes;
}

/**
 * Génère les échéances mensuelles d'un bail. Idempotent : la contrainte unique
 * (bail_id, periode) + `ignoreDuplicates` évitent tout doublon si on réactive un
 * bail. Le montant dû est figé (loyer + charges au moment de la génération).
 * On reçoit le client de session (RLS) : l'insertion reste cloisonnée à l'agence.
 */
export async function genererEcheances(
  supabase: SupabaseClient,
  agenceId: string,
  bail: BailPourEcheances
): Promise<number> {
  const periodes = periodesMensuelles(bail.dateDebut, bail.dateFin);
  if (periodes.length === 0) return 0;

  const montantDu = bail.loyerMensuel + bail.chargesMensuelles;
  const jour = String(bail.jourEcheance).padStart(2, "0");

  const rows = periodes.map((p) => ({
    agence_id: agenceId,
    bail_id: bail.id,
    periode: p,
    date_echeance: `${p.slice(0, 7)}-${jour}`,
    montant_du: montantDu,
  }));

  const { error } = await supabase
    .from("echeances_loyer")
    .upsert(rows, { onConflict: "bail_id,periode", ignoreDuplicates: true });

  if (error) throw new Error(`Génération des échéances impossible : ${error.message}`);
  return rows.length;
}

/** Échéances d'un bail, de la plus ancienne à la plus récente (RLS). */
export async function getEcheancesBail(bailId: string): Promise<EcheanceLoyer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("echeances_loyer")
    .select("id, periode, date_echeance, montant_du, montant_regle, statut")
    .eq("bail_id", bailId)
    .order("periode", { ascending: true });

  if (error) throw new Error(`Lecture des échéances impossible : ${error.message}`);

  const lignes = (data ?? []) as unknown as Record<string, unknown>[];
  return lignes.map((e) => ({
    id: e.id as string,
    periode: e.periode as string,
    dateEcheance: e.date_echeance as string,
    montantDu: (e.montant_du as number) ?? 0,
    montantRegle: (e.montant_regle as number) ?? 0,
    statut: e.statut as EcheanceLoyer["statut"],
  }));
}
