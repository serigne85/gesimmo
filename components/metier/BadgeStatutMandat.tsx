import { STATUT_MANDAT_LABELS, type StatutMandat } from "@/types/mandat";

/**
 * Pastille colorée du statut d'un mandat. Même code couleur que l'app :
 * vert = actif, ambre = en cours/attente, rouge = expiré/résilié, gris = inactif.
 */
const COULEURS: Record<StatutMandat, string> = {
  brouillon: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  en_attente_signature:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  actif: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  expire: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  resilie: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  archive: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function BadgeStatutMandat({ statut }: { statut: StatutMandat }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COULEURS[statut]}`}
    >
      {STATUT_MANDAT_LABELS[statut]}
    </span>
  );
}
