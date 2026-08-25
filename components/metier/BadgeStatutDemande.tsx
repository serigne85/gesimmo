import { STATUT_DEMANDE_LABELS, type StatutDemande } from "@/types/demande";

/**
 * Pastille colorée du statut d'une demande. Code couleur de l'app :
 * vert = active, bleu = satisfaite (conclue), gris = annulée.
 */
const COULEURS: Record<StatutDemande, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  satisfaite: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  annulee: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function BadgeStatutDemande({
  statut,
}: {
  statut: StatutDemande;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COULEURS[statut]}`}
    >
      {STATUT_DEMANDE_LABELS[statut]}
    </span>
  );
}
