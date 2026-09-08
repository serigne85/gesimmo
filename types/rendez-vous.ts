export type TypeRendezVous =
  | "rendez_vous"
  | "visite"
  | "appel"
  | "signature"
  | "autre";

export type StatutRendezVous =
  | "planifie"
  | "confirme"
  | "realise"
  | "annule"
  | "reporte";

export type NiveauInteret = "faible" | "moyen" | "fort";

export const TYPES_RENDEZ_VOUS: TypeRendezVous[] = [
  "rendez_vous",
  "visite",
  "appel",
  "signature",
  "autre",
];

export const STATUTS_RENDEZ_VOUS: StatutRendezVous[] = [
  "planifie",
  "confirme",
  "realise",
  "annule",
  "reporte",
];

export const NIVEAUX_INTERET: NiveauInteret[] = ["faible", "moyen", "fort"];

export const TYPE_RENDEZ_VOUS_LABELS: Record<TypeRendezVous, string> = {
  rendez_vous: "Rendez-vous",
  visite: "Visite",
  appel: "Appel",
  signature: "Signature",
  autre: "Autre",
};

export const STATUT_RENDEZ_VOUS_LABELS: Record<StatutRendezVous, string> = {
  planifie: "Planifié",
  confirme: "Confirmé",
  realise: "Réalisé",
  annule: "Annulé",
  reporte: "Reporté",
};

export const NIVEAU_INTERET_LABELS: Record<NiveauInteret, string> = {
  faible: "Faible",
  moyen: "Moyen",
  fort: "Fort",
};

/** Une ligne de l'agenda (liste). */
export type RendezVousListe = {
  id: string;
  titre: string;
  type: TypeRendezVous;
  statut: StatutRendezVous;
  debut: string;
  fin: string | null;
  lieu: string | null;
  contactNom: string | null;
  bienReference: string | null;
  assigneeNom: string | null;
};

/** Compte rendu d'une visite. */
export type CompteRenduVisite = {
  id: string;
  interesse: boolean | null;
  niveauInteret: NiveauInteret | null;
  compteRendu: string;
  suiteADonner: string | null;
  creeLe: string;
  majLe: string;
};

/** Fiche détail / valeurs d'édition d'un rendez-vous. */
export type RendezVousDetail = {
  id: string;
  titre: string;
  type: TypeRendezVous;
  statut: StatutRendezVous;
  debut: string;
  fin: string | null;
  lieu: string | null;
  notes: string | null;
  contactId: string | null;
  contactNom: string | null;
  contactTelephone: string | null;
  bienId: string | null;
  bienReference: string | null;
  assigneeId: string | null;
  assigneeNom: string | null;
  creeLe: string;
  /** Compte rendu, si c'est une visite déjà débriefée. */
  compteRendu: CompteRenduVisite | null;
};
