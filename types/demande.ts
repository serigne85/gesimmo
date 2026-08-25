import type { TypeBien, StatutBien } from "@/types/bien";

/** Un bien correspondant à une demande (résultat de matching). */
export type BienCorrespondant = {
  id: string;
  reference: string;
  titre: string | null;
  type: TypeBien;
  statut: StatutBien;
  zoneNom: string | null;
  villeNom: string | null;
  prix: number | null;
};

export type ObjectifDemande = "achat" | "location";
export type StatutDemande = "active" | "satisfaite" | "annulee";

export const OBJECTIFS_DEMANDE: ObjectifDemande[] = ["achat", "location"];

export const OBJECTIF_DEMANDE_LABELS: Record<ObjectifDemande, string> = {
  achat: "Achat",
  location: "Location",
};

export const STATUT_DEMANDE_LABELS: Record<StatutDemande, string> = {
  active: "Active",
  satisfaite: "Satisfaite",
  annulee: "Annulée",
};

/** Fiche détail complète d'une demande. */
export type DemandeDetail = {
  id: string;
  clientNom: string;
  clientTelephone: string;
  objectif: ObjectifDemande;
  statut: StatutDemande;
  budgetMin: number | null;
  budgetMax: number | null;
  nombreChambresMin: number | null;
  surfaceMin: number | null;
  zones: { id: string; nom: string }[];
  types: TypeBien[];
  notes: string | null;
  dateDemande: string;
  dateEcheance: string | null;
  creeLe: string;
};

/** Valeurs brutes d'une demande pour pré-remplir le formulaire d'édition. Le
 *  client (nom/téléphone) est affiché mais non modifiable ici (contact partagé). */
export type DemandeEdition = {
  id: string;
  clientNom: string;
  clientTelephone: string;
  objectif: ObjectifDemande;
  statut: StatutDemande;
  budgetMin: number | null;
  budgetMax: number | null;
  nombreChambresMin: number | null;
  surfaceMin: number | null;
  zoneIds: string[];
  types: TypeBien[];
  dateDemande: string;
  dateEcheance: string | null;
  notes: string | null;
};

/** Une ligne de la liste des demandes (avec libellés joints). */
export type DemandeListe = {
  id: string;
  clientNom: string;
  clientTelephone: string;
  objectif: ObjectifDemande;
  statut: StatutDemande;
  budgetMin: number | null;
  budgetMax: number | null;
  nombreChambresMin: number | null;
  surfaceMin: number | null;
  zones: string[]; // noms des zones ciblées
  types: TypeBien[]; // types recherchés
  dateDemande: string;
  dateEcheance: string | null;
  creeLe: string;
};
