/** Socle minimal d'un contact (personne). Enrichi plus tard (rôles, e-mail…). */
export type Contact = {
  id: string;
  nomComplet: string;
  telephone: string;
};
