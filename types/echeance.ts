/** Statut d'encaissement d'une échéance. Recalculé depuis les paiements. */
export type StatutEcheance = "impaye" | "partiel" | "paye";

/**
 * Situation affichée d'une échéance : croise le statut d'encaissement et le
 * temps. « En retard » n'est pas stocké — il se dérive d'un impayé dont la date
 * est passée. C'est ce qui pilote le code couleur (vert/ambre/rouge).
 */
export type SituationEcheance = "a_venir" | "en_retard" | "partiel" | "paye";

export const SITUATION_ECHEANCE_LABELS: Record<SituationEcheance, string> = {
  a_venir: "À venir",
  en_retard: "En retard",
  partiel: "Partiel",
  paye: "Payé",
};

/** Ordre d'affichage des situations (filtres du suivi). */
export const SITUATIONS_ECHEANCE: SituationEcheance[] = [
  "en_retard",
  "a_venir",
  "partiel",
  "paye",
];

/**
 * Situation d'une échéance à une date donnée. `aujourdhui` est passé en
 * paramètre (au format AAAA-MM-JJ) pour rester pur et testable, et calculé en
 * Africa/Dakar côté serveur.
 */
export function situationEcheance(
  statut: StatutEcheance,
  dateEcheance: string,
  aujourdhui: string
): SituationEcheance {
  if (statut === "paye") return "paye";
  if (statut === "partiel") return "partiel";
  return dateEcheance < aujourdhui ? "en_retard" : "a_venir";
}

/** Reste à payer sur une échéance (jamais négatif, même en cas de trop-perçu). */
export function resteEcheance(montantDu: number, montantRegle: number): number {
  return Math.max(0, montantDu - montantRegle);
}

/** Une échéance de loyer d'un bail. */
export type EcheanceLoyer = {
  id: string;
  periode: string;
  dateEcheance: string;
  montantDu: number;
  montantRegle: number;
  statut: StatutEcheance;
};
