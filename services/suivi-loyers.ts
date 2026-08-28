import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  situationEcheance,
  resteEcheance,
  type SituationEcheance,
} from "@/types/echeance";
import type { SuiviLigne, SuiviLoyers } from "@/types/suivi";

/** Extrait un objet lié qu'il soit renvoyé comme objet ou comme tableau. */
function premier<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

/**
 * Suivi des loyers d'un mois : toutes les échéances de la période, avec leur
 * situation (à venir / en retard / partiel / payé) calculée côté serveur. Les
 * totaux portent sur TOUT le mois ; le filtre par situation ne restreint que la
 * liste affichée. RLS : cloisonné à l'agence.
 */
export async function getSuiviLoyers(
  mois: string,
  situationFiltre?: SituationEcheance
): Promise<SuiviLoyers> {
  const supabase = await createClient();
  const periode = `${mois}-01`;
  const aujourdhui = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Dakar",
  });

  const { data, error } = await supabase
    .from("echeances_loyer")
    .select(
      "id, bail_id, periode, date_echeance, montant_du, montant_regle, statut, derniere_relance_le, baux(reference, biens(reference, titre), locataire:contacts(nom_complet, telephone))"
    )
    .eq("periode", periode)
    .order("date_echeance", { ascending: true });

  if (error) throw new Error(`Lecture du suivi impossible : ${error.message}`);

  const lignes = (data ?? []) as unknown as Record<string, unknown>[];
  const rows: SuiviLigne[] = lignes.map((e) => {
    const bail = premier(
      e.baux as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const bien = premier(
      bail?.biens as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const locataire = premier(
      bail?.locataire as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const statut = e.statut as SuiviLigne["statut"];
    const dateEcheance = e.date_echeance as string;

    return {
      echeanceId: e.id as string,
      bailId: e.bail_id as string,
      periode: e.periode as string,
      dateEcheance,
      montantDu: (e.montant_du as number) ?? 0,
      montantRegle: (e.montant_regle as number) ?? 0,
      statut,
      situation: situationEcheance(statut, dateEcheance, aujourdhui),
      bailReference: (bail?.reference as string) ?? "",
      bienReference: (bien?.reference as string) ?? "",
      bienTitre: (bien?.titre as string | null) ?? null,
      locataireNom: (locataire?.nom_complet as string) ?? "",
      locataireTelephone: (locataire?.telephone as string) ?? "",
      derniereRelanceLe: (e.derniere_relance_le as string | null) ?? null,
    };
  });

  // Totaux sur tout le mois (avant filtre de situation).
  const totaux = rows.reduce(
    (acc, r) => {
      acc.du += r.montantDu;
      acc.regle += r.montantRegle;
      acc.reste += resteEcheance(r.montantDu, r.montantRegle);
      if (r.situation === "en_retard") {
        acc.nbEnRetard += 1;
        acc.montantEnRetard += resteEcheance(r.montantDu, r.montantRegle);
      }
      return acc;
    },
    { du: 0, regle: 0, reste: 0, nbEnRetard: 0, montantEnRetard: 0 }
  );

  const rowsFiltrees = situationFiltre
    ? rows.filter((r) => r.situation === situationFiltre)
    : rows;

  return { mois, rows: rowsFiltrees, totaux };
}
