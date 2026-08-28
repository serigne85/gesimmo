import type { SituationEcheance, StatutEcheance } from "@/types/echeance";

/** Une ligne du suivi des loyers (une échéance, contexte joint). */
export type SuiviLigne = {
  echeanceId: string;
  bailId: string;
  periode: string;
  dateEcheance: string;
  montantDu: number;
  montantRegle: number;
  statut: StatutEcheance;
  situation: SituationEcheance;
  bailReference: string;
  bienReference: string;
  bienTitre: string | null;
  locataireNom: string;
  locataireTelephone: string;
  derniereRelanceLe: string | null;
};

/** Totaux d'un mois (calculés sur toutes les échéances du mois). */
export type SuiviTotaux = {
  du: number;
  regle: number;
  reste: number;
  nbEnRetard: number;
  montantEnRetard: number;
};

export type SuiviLoyers = {
  mois: string; // AAAA-MM
  rows: SuiviLigne[];
  totaux: SuiviTotaux;
};

/** Mois courant (Africa/Dakar) au format AAAA-MM. */
export function moisCourant(): string {
  return new Date()
    .toLocaleDateString("en-CA", { timeZone: "Africa/Dakar" })
    .slice(0, 7);
}

/** Décale un mois « AAAA-MM » de `delta` mois (calcul UTC, sans dérive TZ). */
function decalerMois(mois: string, delta: number): string {
  const [y, m] = mois.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, 1));
  date.setUTCMonth(date.getUTCMonth() + delta);
  return date.toISOString().slice(0, 7);
}

export function moisPrecedent(mois: string): string {
  return decalerMois(mois, -1);
}

export function moisSuivant(mois: string): string {
  return decalerMois(mois, 1);
}
