import {
  STATUT_RENDEZ_VOUS_LABELS,
  type StatutRendezVous,
} from "@/types/rendez-vous";

/**
 * Pastille du statut d'un rendez-vous. Ambre = planifié, bleu = confirmé,
 * vert = réalisé, gris = annulé, ambre = reporté.
 */
const COULEURS: Record<StatutRendezVous, string> = {
  planifie: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  confirme: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  realise: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  annule: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  reporte: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

export default function BadgeStatutRendezVous({
  statut,
}: {
  statut: StatutRendezVous;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COULEURS[statut]}`}
    >
      {STATUT_RENDEZ_VOUS_LABELS[statut]}
    </span>
  );
}
