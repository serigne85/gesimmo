import {
  SITUATION_ECHEANCE_LABELS,
  type SituationEcheance,
} from "@/types/echeance";

/**
 * Pastille de situation d'une échéance. Code couleur du projet :
 * vert = payé, ambre = partiel/à venir, rouge = en retard.
 */
const COULEURS: Record<SituationEcheance, string> = {
  paye: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  partiel: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  a_venir: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  en_retard: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default function BadgeSituationEcheance({
  situation,
}: {
  situation: SituationEcheance;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COULEURS[situation]}`}
    >
      {SITUATION_ECHEANCE_LABELS[situation]}
    </span>
  );
}
