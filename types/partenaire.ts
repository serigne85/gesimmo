/** Un partenaire : agence confrère, courtier ou démarcheur. */
export type TypePartenaire = "agence" | "courtier" | "demarcheur" | "autre";

export const TYPES_PARTENAIRE: TypePartenaire[] = [
  "agence",
  "courtier",
  "demarcheur",
  "autre",
];

export const TYPE_PARTENAIRE_LABELS: Record<TypePartenaire, string> = {
  agence: "Agence",
  courtier: "Courtier",
  demarcheur: "Démarcheur",
  autre: "Autre",
};

/** Une ligne de la liste des partenaires. */
export type PartenaireListe = {
  id: string;
  nom: string;
  type: TypePartenaire;
  telephone: string | null;
  email: string | null;
  tauxCommissionDefaut: number | null; // pourcentage
  actif: boolean;
  creeLe: string;
};

/** Fiche détail d'un partenaire (liste + notes). */
export type PartenaireDetail = PartenaireListe & {
  notes: string | null;
};

/** Valeurs brutes d'un partenaire pour pré-remplir le formulaire d'édition. */
export type PartenaireEdition = {
  id: string;
  nom: string;
  type: TypePartenaire;
  telephone: string | null;
  email: string | null;
  tauxCommissionDefaut: number | null;
  notes: string | null;
  actif: boolean;
};

/** Option légère pour un sélecteur (partenaires actifs uniquement). */
export type PartenaireOption = {
  id: string;
  nom: string;
  type: TypePartenaire;
};
