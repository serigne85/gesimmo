import {
  STATUT_MISE_EN_RELATION_LABELS,
  type StatutMiseEnRelation,
} from "@/types/mise-en-relation";

/**
 * Pastille colorée du statut d'une mise en relation. Code couleur de l'app :
 * ambre = en attente (soumise, négociation), bleu = en cours (proposition,
 * visite), vert = conclue, rouge = échouée, gris = annulée.
 */
const COULEURS: Record<StatutMiseEnRelation, string> = {
  soumise: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  proposition_recue:
    "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  visite: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  en_negociation:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  conclue: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  echouee: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  annulee: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function BadgeStatutMiseEnRelation({
  statut,
}: {
  statut: StatutMiseEnRelation;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COULEURS[statut]}`}
    >
      {STATUT_MISE_EN_RELATION_LABELS[statut]}
    </span>
  );
}
