import type { StatutBien, ObjectifBien } from "@/types/bien";

/**
 * Machine à états du cycle de vie d'un bien (CLAUDE.md). Aucune transition en
 * dur ailleurs : cette carte est l'unique source de vérité, côté serveur comme
 * côté interface. `archive` reste réversible vers `prospecte` pour ne jamais
 * figer un bien sur une fausse manœuvre.
 */
const TRANSITIONS: Record<StatutBien, StatutBien[]> = {
  prospecte: ["sous_mandat", "disponible", "a_relancer", "suspendu", "perdu", "archive"],
  a_relancer: ["prospecte", "sous_mandat", "disponible", "perdu", "archive"],
  sous_mandat: ["disponible", "suspendu", "perdu", "archive"],
  disponible: ["sous_offre", "suspendu", "perdu", "archive"],
  sous_offre: ["vendu", "loue", "disponible", "suspendu", "archive"],
  vendu: ["archive"],
  loue: ["disponible", "archive"],
  suspendu: ["disponible", "archive"],
  perdu: ["prospecte", "archive"],
  archive: ["prospecte"],
};

/** Transitions lourdes : on demande confirmation avant de les appliquer. */
export const STATUTS_A_CONFIRMER: StatutBien[] = ["vendu", "loue", "perdu", "archive"];

/**
 * Statuts vers lesquels un bien peut basculer, filtrés selon l'objectif :
 * un bien en vente ne peut pas devenir « loué », un bien en location « vendu ».
 */
export function transitionsPossibles(
  statut: StatutBien,
  objectif: ObjectifBien
): StatutBien[] {
  return TRANSITIONS[statut].filter((cible) => {
    if (cible === "vendu") return objectif === "vente";
    if (cible === "loue") return objectif === "location";
    return true;
  });
}

/** La transition demandée est-elle autorisée ? (contrôle serveur obligatoire) */
export function transitionAutorisee(
  actuel: StatutBien,
  cible: StatutBien,
  objectif: ObjectifBien
): boolean {
  return transitionsPossibles(actuel, objectif).includes(cible);
}
