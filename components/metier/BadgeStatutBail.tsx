import { STATUT_BAIL_LABELS, type StatutBail } from "@/types/bail";

/**
 * Pastille colorée du statut d'un bail. Même code couleur que l'app :
 * vert = actif, rouge = résilié/expiré, gris = brouillon/archivé.
 */
const COULEURS: Record<StatutBail, string> = {
  brouillon: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  actif: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  resilie: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  expire: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  archive: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function BadgeStatutBail({ statut }: { statut: StatutBail }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COULEURS[statut]}`}
    >
      {STATUT_BAIL_LABELS[statut]}
    </span>
  );
}
