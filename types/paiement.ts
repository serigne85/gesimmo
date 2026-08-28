import type { ModePaiement } from "@/types/bail";
import type { StatutEcheance } from "@/types/echeance";

/** Un paiement encaissé sur une échéance. */
export type Paiement = {
  id: string;
  montant: number;
  datePaiement: string;
  mode: ModePaiement;
  referenceTransaction: string | null;
  note: string | null;
  encaisseParNom: string | null;
  creeLe: string;
};

/**
 * Échéance vue depuis son écran d'encaissement : montants, contexte (bail,
 * bien, locataire) et paiements déjà enregistrés.
 */
export type EcheanceDetail = {
  id: string;
  bailId: string;
  periode: string;
  dateEcheance: string;
  montantDu: number;
  montantRegle: number;
  statut: StatutEcheance;
  bailReference: string;
  bienReference: string;
  bienTitre: string | null;
  locataireNom: string;
  locataireTelephone: string;
  paiements: Paiement[];
};

/**
 * Données d'une quittance de loyer (document mensuel attestant le paiement
 * intégral d'une échéance). N'a de valeur que si l'échéance est soldée.
 */
export type QuittanceData = {
  echeanceId: string;
  periode: string;
  statut: StatutEcheance;
  loyer: number;
  charges: number;
  total: number;
  regle: number;
  agenceNom: string;
  agenceVille: string | null;
  bailReference: string;
  bienReference: string;
  bienTitre: string | null;
  bienAdresse: string | null;
  locataireNom: string;
  derniereDatePaiement: string | null;
};

/** Données figées d'un reçu de paiement (pour l'impression). */
export type PaiementRecu = {
  id: string;
  montant: number;
  datePaiement: string;
  mode: ModePaiement;
  referenceTransaction: string | null;
  encaisseParNom: string | null;
  agenceNom: string;
  bailReference: string;
  periode: string;
  bienReference: string;
  bienTitre: string | null;
  locataireNom: string;
  /** Reste à payer sur le mois après prise en compte des paiements (0 si soldé). */
  resteMois: number;
};
