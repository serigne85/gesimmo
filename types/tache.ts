export type TypeTache = "relance" | "appel" | "administratif" | "autre";
export type PrioriteTache = "basse" | "normale" | "haute";
export type StatutTache = "a_faire" | "en_cours" | "faite" | "annulee";

export type LienTache =
  | "bien"
  | "contact"
  | "mandat"
  | "demande"
  | "bail"
  | "partenaire"
  | "mise_en_relation";

export const TYPES_TACHE: TypeTache[] = [
  "relance",
  "appel",
  "administratif",
  "autre",
];
export const PRIORITES_TACHE: PrioriteTache[] = ["basse", "normale", "haute"];
export const STATUTS_TACHE: StatutTache[] = [
  "a_faire",
  "en_cours",
  "faite",
  "annulee",
];

export const TYPE_TACHE_LABELS: Record<TypeTache, string> = {
  relance: "Relance",
  appel: "Appel",
  administratif: "Administratif",
  autre: "Autre",
};

export const PRIORITE_TACHE_LABELS: Record<PrioriteTache, string> = {
  basse: "Basse",
  normale: "Normale",
  haute: "Haute",
};

export const STATUT_TACHE_LABELS: Record<StatutTache, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  faite: "Faite",
  annulee: "Annulée",
};

/** Chemin de la fiche liée, pour naviguer depuis une tâche. */
export const LIEN_TACHE_BASE: Record<LienTache, string> = {
  bien: "/biens",
  contact: "/contacts",
  mandat: "/mandats",
  demande: "/demandes",
  bail: "/gestion-locative",
  partenaire: "/partenaires",
  mise_en_relation: "/mises-en-relation",
};

export const LIEN_TACHE_LABELS: Record<LienTache, string> = {
  bien: "Bien",
  contact: "Contact",
  mandat: "Mandat",
  demande: "Demande",
  bail: "Bail",
  partenaire: "Partenaire",
  mise_en_relation: "Mise en relation",
};

/** Une ligne de la liste des tâches. */
export type TacheListe = {
  id: string;
  titre: string;
  type: TypeTache;
  priorite: PrioriteTache;
  statut: StatutTache;
  dateEcheance: string | null;
  assigneeNom: string | null;
  lienType: LienTache | null;
  lienId: string | null;
  creeLe: string;
};

/** Fiche détail / valeurs d'édition d'une tâche. */
export type TacheDetail = {
  id: string;
  titre: string;
  description: string | null;
  type: TypeTache;
  priorite: PrioriteTache;
  statut: StatutTache;
  dateEcheance: string | null;
  faitLe: string | null;
  assigneeId: string | null;
  assigneeNom: string | null;
  lienType: LienTache | null;
  lienId: string | null;
  creeLe: string;
};
