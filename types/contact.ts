/**
 * Désignation d'un contact dans l'annuaire unifié. Elle se DÉDUIT des relations
 * (il n'y a pas de table contact_roles) et de la source :
 *  - proprietaire     : référencé par biens.proprietaire_id
 *  - contact_associe  : référencé par biens.contact_id (gardien, mandataire…)
 *  - locataire        : référencé par baux.locataire_id
 *  - partenaire       : présent dans la table partenaires
 *  - prospect         : présent dans la table prospections
 *  - contact          : présent dans contacts sans autre rôle (repli)
 */
export type DesignationContact =
  | "proprietaire"
  | "contact_associe"
  | "locataire"
  | "partenaire"
  | "prospect"
  | "contact";

/** Ordre d'affichage stable des désignations. */
export const DESIGNATIONS_CONTACT: DesignationContact[] = [
  "proprietaire",
  "contact_associe",
  "locataire",
  "partenaire",
  "prospect",
  "contact",
];

export const DESIGNATION_CONTACT_LABELS: Record<DesignationContact, string> = {
  proprietaire: "Propriétaire",
  contact_associe: "Contact associé",
  locataire: "Locataire",
  partenaire: "Partenaire",
  prospect: "Prospect",
  contact: "Contact",
};

/** Une ligne de l'annuaire unifié (fusionnée par téléphone). */
export type ContactUnifie = {
  cle: string;
  nomComplet: string;
  telephone: string;
  designations: DesignationContact[];
  /** Lien vers la fiche la plus spécifique (partenaire/prospect), si elle existe. */
  href: string | null;
};
