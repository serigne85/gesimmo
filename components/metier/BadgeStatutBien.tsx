import { STATUT_BIEN_LABELS, type StatutBien } from "@/types/bien";

/**
 * Pastille colorée du statut d'un bien. Code couleur unique de l'app
 * (CLAUDE.md) : vert = actif/disponible, ambre = en cours, bleu = conclu,
 * gris = archivé.
 */
const COULEURS: Record<StatutBien, string> = {
  disponible: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  prospecte: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  sous_mandat: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  sous_offre: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  suspendu: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  vendu: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  loue: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  archive: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function BadgeStatutBien({ statut }: { statut: StatutBien }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COULEURS[statut]}`}
    >
      {STATUT_BIEN_LABELS[statut]}
    </span>
  );
}
