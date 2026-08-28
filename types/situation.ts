/** Un propriétaire proposé au sélecteur (ceux qui ont au moins un bail). */
export type ProprietaireOption = {
  id: string;
  nomComplet: string;
};

/** Une ligne de la situation : un bail (donc un locataire) du propriétaire. */
export type SituationLigne = {
  bailId: string;
  bienReference: string;
  bienTitre: string | null;
  locataireNom: string;
  loyerDu: number;
  encaisse: number;
  commission: number;
  reverse: number;
  reste: number;
};

/** Totaux d'une situation propriétaire (somme des lignes). */
export type SituationTotaux = {
  loyerDu: number;
  encaisse: number;
  commission: number;
  reverse: number;
  reste: number;
};

/** Situation locative d'un propriétaire pour un mois. */
export type SituationProprietaire = {
  proprietaireId: string;
  proprietaireNom: string;
  proprietaireTelephone: string;
  mois: string; // AAAA-MM
  lignes: SituationLigne[];
  totaux: SituationTotaux;
};
