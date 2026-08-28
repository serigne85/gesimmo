import type { StatutBail } from "@/types/bail";

/**
 * Machine à états du cycle de vie d'un bail. Unique source de vérité des
 * transitions, côté serveur comme côté interface (sur le modèle de
 * services/statuts-bien). `archive` reste réversible vers `brouillon` pour ne
 * jamais figer un bail sur une fausse manœuvre.
 */
const TRANSITIONS: Record<StatutBail, StatutBail[]> = {
  brouillon: ["actif", "archive"],
  actif: ["resilie", "expire", "archive"],
  resilie: ["archive"],
  expire: ["archive"],
  archive: ["brouillon"],
};

/** Transitions lourdes : on demande confirmation avant de les appliquer. */
export const STATUTS_A_CONFIRMER: StatutBail[] = [
  "actif",
  "resilie",
  "expire",
  "archive",
];

/** Statuts vers lesquels un bail peut basculer depuis son statut actuel. */
export function transitionsPossibles(statut: StatutBail): StatutBail[] {
  return TRANSITIONS[statut];
}

/** La transition demandée est-elle autorisée ? (contrôle serveur obligatoire) */
export function transitionAutorisee(
  actuel: StatutBail,
  cible: StatutBail
): boolean {
  return TRANSITIONS[actuel].includes(cible);
}
