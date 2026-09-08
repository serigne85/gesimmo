import type { TypePartenaire } from "@/types/partenaire";

/** Sens de la mise en relation.
 *  sortante : notre demande → soumise à un partenaire (il propose un produit).
 *  entrante : le partenaire amène un client pour un de nos biens. */
export type SensMiseEnRelation = "sortante" | "entrante";

export const SENS_MISE_EN_RELATION_LABELS: Record<SensMiseEnRelation, string> = {
  sortante: "Soumise à un partenaire",
  entrante: "Client amené par un partenaire",
};

/** Cycle de vie d'une affaire d'apport. */
export type StatutMiseEnRelation =
  | "soumise"
  | "proposition_recue"
  | "visite"
  | "en_negociation"
  | "conclue"
  | "echouee"
  | "annulee";

export const STATUTS_MISE_EN_RELATION: StatutMiseEnRelation[] = [
  "soumise",
  "proposition_recue",
  "visite",
  "en_negociation",
  "conclue",
  "echouee",
  "annulee",
];

export const STATUT_MISE_EN_RELATION_LABELS: Record<StatutMiseEnRelation, string> = {
  soumise: "Soumise",
  proposition_recue: "Proposition reçue",
  visite: "Visite",
  en_negociation: "En négociation",
  conclue: "Conclue",
  echouee: "Échouée",
  annulee: "Annulée",
};

/** Type d'événement du journal de suivi. */
export type TypeSuivi =
  | "note"
  | "appel"
  | "proposition"
  | "visite"
  | "offre"
  | "changement_statut"
  | "commission";

export const TYPES_SUIVI: TypeSuivi[] = [
  "note",
  "appel",
  "proposition",
  "visite",
  "offre",
  "changement_statut",
  "commission",
];

export const TYPE_SUIVI_LABELS: Record<TypeSuivi, string> = {
  note: "Note",
  appel: "Appel",
  proposition: "Proposition",
  visite: "Visite",
  offre: "Offre",
  changement_statut: "Changement de statut",
  commission: "Commission",
};

/** Un événement du journal chronologique. */
export type SuiviEvenement = {
  id: string;
  type: TypeSuivi;
  description: string;
  dateEvenement: string;
  auteurNom: string | null;
  creeLe: string;
};

/** Une ligne de la liste des mises en relation. */
export type MiseEnRelationListe = {
  id: string;
  sens: SensMiseEnRelation;
  statut: StatutMiseEnRelation;
  clientNom: string; // vide en entrante (le client vient du partenaire)
  clientTelephone: string;
  partenaireNom: string;
  partenaireType: TypePartenaire;
  bienResume: string | null; // référence/titre du bien (entrante)
  partAgence: number | null; // FCFA prévu
  commissionPercue: number | null; // FCFA encaissé
  dateSoumission: string;
  creeLe: string;
};

/** Fiche détail d'une mise en relation, journal de suivi inclus. */
export type MiseEnRelationDetail = {
  id: string;
  demandeId: string | null;
  partenaireId: string;
  sens: SensMiseEnRelation;
  statut: StatutMiseEnRelation;
  clientNom: string;
  clientTelephone: string;
  partenaireNom: string;
  partenaireType: TypePartenaire;
  bienPropose: string | null;
  bienId: string | null;
  bienReference: string | null;
  bienTitre: string | null;
  commissionTotale: number | null;
  partAgence: number | null;
  partPartenaire: number | null;
  commissionPercue: number | null;
  dateSoumission: string;
  dateConclusion: string | null;
  creeLe: string;
  suivi: SuiviEvenement[];
};
