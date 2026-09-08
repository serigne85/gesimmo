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
  /** Id dans la table `contacts` si l'entrée en provient (→ fiche /contacts/[id]). */
  contactId: string | null;
  /** Lien vers la fiche la plus spécifique (partenaire/prospect), si elle existe. */
  href: string | null;
};

/** Un bien lié à un contact dans sa fiche détail. */
export type BienLieContact = {
  id: string;
  reference: string;
  titre: string | null;
  statut: string;
};

/** Un bail lié à un contact (comme locataire). */
export type BailLieContact = {
  id: string;
  reference: string;
  bienReference: string | null;
  loyerMensuel: number;
  statut: string;
};

/** Une mise en relation liée à un contact (via ses demandes). */
export type MiseEnRelationLieeContact = {
  id: string;
  statut: string;
  partenaireNom: string;
};

/** Fiche détail d'un contact (entité de la table `contacts`). */
export type ContactDetail = {
  id: string;
  nomComplet: string;
  telephone: string;
  creeLe: string;
  designations: DesignationContact[];
  biensProprietaire: BienLieContact[];
  biensAssocie: BienLieContact[];
  baux: BailLieContact[];
  misesEnRelation: MiseEnRelationLieeContact[];
};
