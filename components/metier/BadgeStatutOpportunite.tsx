import {
  STATUT_OPPORTUNITE_LABELS,
  type StatutOpportunite,
} from "@/types/opportunite";

/**
 * Pastille colorée du statut d'une opportunité. Code couleur de l'app :
 * bleu = ouverte (en cours), vert = gagnée, rouge = perdue.
 */
const COULEURS: Record<StatutOpportunite, string> = {
  ouverte: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  gagnee: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  perdue: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default function BadgeStatutOpportunite({
  statut,
}: {
  statut: StatutOpportunite;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COULEURS[statut]}`}
    >
      {STATUT_OPPORTUNITE_LABELS[statut]}
    </span>
  );
}
