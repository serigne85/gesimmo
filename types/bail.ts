import type { TypeBien, StatutBien } from "@/types/bien";
import type { TypeMandat, CommissionUnite } from "@/types/mandat";

/** Cycle de vie d'un bail. Plus simple qu'un mandat (pas de signature). */
export type StatutBail = "brouillon" | "actif" | "resilie" | "expire" | "archive";

/** Modes de paiement en usage à Dakar (CLAUDE.md). Partagé avec les paiements. */
export type ModePaiement =
  | "especes"
  | "wave"
  | "orange_money"
  | "virement"
  | "cheque"
  | "depot_bancaire";

export const STATUTS_BAIL: StatutBail[] = [
  "brouillon",
  "actif",
  "resilie",
  "expire",
  "archive",
];

export const STATUT_BAIL_LABELS: Record<StatutBail, string> = {
  brouillon: "Brouillon",
  actif: "Actif",
  resilie: "Résilié",
  expire: "Expiré",
  archive: "Archivé",
};

export const MODES_PAIEMENT: ModePaiement[] = [
  "especes",
  "wave",
  "orange_money",
  "virement",
  "cheque",
  "depot_bancaire",
];

export const MODE_PAIEMENT_LABELS: Record<ModePaiement, string> = {
  especes: "Espèces",
  wave: "Wave",
  orange_money: "Orange Money",
  virement: "Virement",
  cheque: "Chèque",
  depot_bancaire: "Dépôt bancaire",
};

/** Loyer total mensuel dû = loyer + charges (FCFA). */
export function loyerTotal(
  loyerMensuel: number,
  chargesMensuelles: number | null | undefined
): number {
  return loyerMensuel + (chargesMensuelles ?? 0);
}

/** Montant de la caution = loyer × nombre de mois (FCFA), ou null si non défini. */
export function montantCaution(
  loyerMensuel: number,
  cautionMois: number | null | undefined
): number | null {
  if (cautionMois === null || cautionMois === undefined) return null;
  return Math.round(loyerMensuel * cautionMois);
}

/** Une ligne de la liste des baux (avec libellés joints). */
export type BailListe = {
  id: string;
  reference: string;
  statut: StatutBail;
  dateDebut: string | null;
  dateFin: string | null;
  loyerMensuel: number;
  chargesMensuelles: number;
  bienReference: string;
  bienTitre: string | null;
  locataireNom: string;
  locataireTelephone: string;
};

/** Un bien proposé au choix lors de la création d'un bail (objectif location). */
export type BienLouable = {
  id: string;
  reference: string;
  titre: string | null;
  type: TypeBien;
};

/** Fiche complète d'un bail (bien, locataire et mandat joints). */
export type BailDetail = {
  id: string;
  reference: string;
  statut: StatutBail;
  dateDebut: string | null;
  dateFin: string | null;
  loyerMensuel: number;
  chargesMensuelles: number;
  cautionMois: number | null;
  jourEcheance: number;
  modePaiement: ModePaiement | null;
  notes: string | null;
  creeLe: string;
  bienId: string;
  bienReference: string;
  bienTitre: string | null;
  bienStatut: StatutBien;
  locataireNom: string;
  locataireTelephone: string;
  mandatId: string | null;
  mandatReference: string | null;
  mandatType: TypeMandat | null;
  mandatCommissionValeur: number | null;
  mandatCommissionUnite: CommissionUnite | null;
};
