import { moisCourant } from "@/types/suivi";

/** Une période de rapport, en mois inclusifs (AAAA-MM à AAAA-MM). */
export type RapportPeriode = { debut: string; fin: string };

/** Une ligne de répartition (un segment et son effectif). */
export type RepartitionLigne = { cle: string; label: string; nombre: number };

/** Vue agrégée des rapports de direction. Tout est calculé côté serveur. */
export type Rapports = {
  periode: RapportPeriode;
  /** Composition du portefeuille à l'instant présent (hors période). */
  portefeuille: {
    total: number;
    parObjectif: RepartitionLigne[];
    parStatut: RepartitionLigne[];
    parType: RepartitionLigne[];
    parZone: RepartitionLigne[];
  };
  /** Activité mesurée sur la période. */
  activite: {
    biensRentres: number;
    mandatsSignes: number;
    bauxEnregistres: number;
    visitesRealisees: number;
  };
  /** Recouvrement locatif sur les mois de la période. */
  recouvrement: {
    du: number;
    encaisse: number;
    reste: number;
    /** Taux d'encaissement en pourcentage (0–100), 0 si rien n'était dû. */
    taux: number;
    nbEcheances: number;
    nbImpayees: number;
  };
  /** Commissions réellement encaissées sur la période. */
  commissions: {
    gerance: number;
    apports: number;
    total: number;
  };
};

/** Valide une chaîne AAAA-MM. */
export function estMoisValide(mois: string | undefined): mois is string {
  return /^\d{4}-\d{2}$/.test(mois ?? "");
}

/**
 * Bornes SQL d'une période de mois : borne basse incluse, borne haute EXCLUE
 * (premier jour du mois suivant `fin`). Convient aux colonnes `date` comme aux
 * `timestamptz` (Dakar = UTC+0, donc minuit UTC = minuit local).
 */
export function bornesPeriode(periode: RapportPeriode): {
  dateDebut: string;
  finExclusif: string;
} {
  const [y, m] = periode.fin.split("-").map(Number);
  const suivant = new Date(Date.UTC(y, m, 1)); // m (0-indexé) = mois APRÈS `fin`
  return {
    dateDebut: `${periode.debut}-01`,
    finExclusif: `${suivant.toISOString().slice(0, 7)}-01`,
  };
}

/** Début du trimestre courant au format AAAA-MM. */
function debutTrimestre(mois: string): string {
  const [y, m] = mois.split("-").map(Number);
  const premier = Math.floor((m - 1) / 3) * 3 + 1;
  return `${y}-${String(premier).padStart(2, "0")}`;
}

/** Présélections de période, calées sur « jusqu'au mois courant ». */
export function presetsPeriode(): {
  cle: string;
  label: string;
  periode: RapportPeriode;
}[] {
  const courant = moisCourant();
  const annee = courant.slice(0, 4);
  return [
    { cle: "mois", label: "Ce mois", periode: { debut: courant, fin: courant } },
    {
      cle: "trimestre",
      label: "Ce trimestre",
      periode: { debut: debutTrimestre(courant), fin: courant },
    },
    {
      cle: "annee",
      label: "Cette année",
      periode: { debut: `${annee}-01`, fin: courant },
    },
  ];
}

/** Période par défaut : l'année en cours jusqu'au mois courant. */
export function periodeDefaut(): RapportPeriode {
  const courant = moisCourant();
  return { debut: `${courant.slice(0, 4)}-01`, fin: courant };
}
