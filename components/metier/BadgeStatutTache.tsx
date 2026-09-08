import { STATUT_TACHE_LABELS, type StatutTache } from "@/types/tache";

/**
 * Pastille du statut d'une tâche. Code couleur de l'app : ambre = à faire,
 * bleu = en cours, vert = faite, gris = annulée.
 */
const COULEURS: Record<StatutTache, string> = {
  a_faire: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  en_cours: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  faite: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  annulee: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function BadgeStatutTache({ statut }: { statut: StatutTache }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COULEURS[statut]}`}
    >
      {STATUT_TACHE_LABELS[statut]}
    </span>
  );
}
