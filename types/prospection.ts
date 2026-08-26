/** Statut de démarchage d'une prospection terrain (distinct du cycle de vie du
 *  bien : une prospection n'est pas encore un bien). */
export type StatutProspection = "indisponible" | "disponible" | "a_relancer";

export const STATUTS_PROSPECTION = [
  "indisponible",
  "disponible",
  "a_relancer",
] as const;

export const STATUT_PROSPECTION_LABELS: Record<StatutProspection, string> = {
  indisponible: "Indisponible",
  disponible: "Disponible",
  a_relancer: "À relancer",
};

/** Une ligne de la liste des prospections (avec libellés joints). */
export type ProspectionListe = {
  id: string;
  dateProspection: string;
  nomComplet: string;
  telephone: string;
  contactNom: string | null;
  contactTel: string | null;
  zoneNom: string | null;
  produit: string | null;
  statut: StatutProspection;
  dateRelance: string | null;
  agentNom: string | null;
  bienId: string | null; // non null => déjà convertie en bien
  creeLe: string;
};

/** Valeurs brutes d'une prospection pour pré-remplir le formulaire d'édition.
 *  Le nom/téléphone appartiennent à la prospection (texte brut), donc modifiables
 *  ici — contrairement à une demande où le client est un contact partagé. */
export type ProspectionEdition = {
  id: string;
  dateProspection: string;
  nomComplet: string;
  telephone: string;
  contactNom: string | null;
  contactTel: string | null;
  zoneId: string | null;
  produit: string | null;
  statut: StatutProspection;
  dateRelance: string | null;
  observation: string | null;
  agentId: string | null;
};
