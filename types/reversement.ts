import type { ModePaiement } from "@/types/bail";
import type { CommissionUnite } from "@/types/mandat";

/**
 * Commission suggérée sur un loyer mensuel, d'après le mandat de gérance :
 *  - pourcentage → % du loyer ;
 *  - montant     → montant fixe mensuel ;
 *  - mois        → 0 (une commission « en mois de loyer » est ponctuelle, pas
 *                  mensuelle : ça ne s'applique pas à un reversement de gérance).
 * Renvoie 0 si le mandat ne porte pas de rémunération exploitable.
 */
export function commissionSuggeree(
  loyer: number,
  valeur: number | null,
  unite: CommissionUnite | null
): number {
  if (valeur === null || !unite) return 0;
  if (unite === "pourcentage") return Math.round((loyer * valeur) / 100);
  if (unite === "montant") return valeur;
  return 0;
}

/** Net à reverser = loyer − commission (jamais négatif). */
export function montantReverse(loyer: number, commission: number): number {
  return Math.max(0, loyer - commission);
}

/** Une ligne d'historique des reversements d'un bail. */
export type ReversementLigne = {
  id: string;
  periode: string;
  montantLoyer: number;
  commission: number;
  montantReverse: number;
  dateReversement: string;
  mode: ModePaiement;
  note: string | null;
};
