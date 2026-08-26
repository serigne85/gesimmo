import {
  STATUT_PROSPECTION_LABELS,
  type StatutProspection,
} from "@/types/prospection";

/**
 * Pastille colorée du statut d'une prospection. Code couleur de l'app :
 * vert = disponible, ambre = à relancer, gris = indisponible.
 */
const COULEURS: Record<StatutProspection, string> = {
  disponible: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  a_relancer: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  indisponible: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function BadgeStatutProspection({
  statut,
}: {
  statut: StatutProspection;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COULEURS[statut]}`}
    >
      {STATUT_PROSPECTION_LABELS[statut]}
    </span>
  );
}
