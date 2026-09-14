/** Statut d'une opportunité. Dérivé du TYPE de l'étape courante (gain/perte),
 *  recalculé côté services/, jamais saisi à la main. */
export type StatutOpportunite = "ouverte" | "gagnee" | "perdue";

/** Type d'une étape de pipeline. 'gain'/'perte' = étapes terminales. */
export type TypeEtape = "normale" | "gain" | "perte";

export const STATUTS_OPPORTUNITE: StatutOpportunite[] = [
  "ouverte",
  "gagnee",
  "perdue",
];

export const STATUT_OPPORTUNITE_LABELS: Record<StatutOpportunite, string> = {
  ouverte: "Ouverte",
  gagnee: "Gagnée",
  perdue: "Perdue",
};

/** Une étape d'un pipeline (colonne du flux). */
export type EtapePipeline = {
  id: string;
  nom: string;
  ordre: number;
  type: TypeEtape;
};

/** Un pipeline configurable, avec ses étapes ordonnées. */
export type Pipeline = {
  id: string;
  nom: string;
  ordre: number;
  etapes: EtapePipeline[];
};

/** Pipeline vu par l'écran d'admin (inclut les pipelines désactivés). */
export type PipelineAdmin = Pipeline & { actif: boolean };

export const TYPES_ETAPE: TypeEtape[] = ["normale", "gain", "perte"];

export const TYPE_ETAPE_LABELS: Record<TypeEtape, string> = {
  normale: "Normale",
  gain: "Gain (gagné)",
  perte: "Perte (perdu)",
};

/** Une opportunité en ligne de liste (libellés joints). */
export type OpportuniteListe = {
  id: string;
  reference: string;
  titre: string;
  statut: StatutOpportunite;
  montantEstime: number | null;
  pipelineId: string;
  etapeId: string;
  bienReference: string | null;
  contactNom: string | null;
  contactTelephone: string | null;
};

/** Les opportunités d'une même étape (une « colonne » du pipeline). */
export type ColonneEtape = {
  etape: EtapePipeline;
  opportunites: OpportuniteListe[];
  totalEstime: number; // somme des montants estimés de la colonne (FCFA)
};

/** Vue pipeline : un pipeline et ses colonnes d'étapes garnies d'opportunités. */
export type VuePipeline = {
  pipeline: Pipeline;
  colonnes: ColonneEtape[];
  total: number; // nombre d'opportunités ouvertes dans ce pipeline
};

/** Type d'un événement du journal de suivi. */
export type TypeSuivi =
  | "note"
  | "changement_etape"
  | "changement_statut"
  | "appel"
  | "visite"
  | "offre";

export const TYPES_SUIVI_SAISISSABLES: TypeSuivi[] = [
  "note",
  "appel",
  "visite",
  "offre",
];

export const TYPE_SUIVI_LABELS: Record<TypeSuivi, string> = {
  note: "Note",
  changement_etape: "Changement d'étape",
  changement_statut: "Changement de statut",
  appel: "Appel",
  visite: "Visite",
  offre: "Offre",
};

/** Un événement du journal de suivi d'une opportunité. */
export type SuiviOpportunite = {
  id: string;
  type: TypeSuivi;
  description: string;
  dateEvenement: string;
  auteurNom: string | null;
};

/** Fiche détail complète d'une opportunité. */
export type OpportuniteDetail = {
  id: string;
  reference: string;
  titre: string;
  statut: StatutOpportunite;
  montantEstime: number | null;
  motifPerte: string | null;
  dateCloture: string | null;
  creeLe: string;
  // Pipeline courant + toutes ses étapes (pour le sélecteur de changement d'étape).
  pipelineId: string;
  pipelineNom: string;
  etapeId: string;
  etapeNom: string;
  etapeType: TypeEtape;
  etapes: EtapePipeline[];
  // Liens optionnels.
  bienId: string | null;
  bienReference: string | null;
  bienTitre: string | null;
  contactId: string | null;
  contactNom: string | null;
  contactTelephone: string | null;
  demandeId: string | null;
  demandeObjectif: string | null;
  demandeStatut: string | null;
  responsableNom: string | null;
  // Journal chronologique (le plus récent d'abord).
  journal: SuiviOpportunite[];
};
