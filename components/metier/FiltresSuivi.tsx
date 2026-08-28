import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  SITUATIONS_ECHEANCE,
  SITUATION_ECHEANCE_LABELS,
  type SituationEcheance,
} from "@/types/echeance";
import { moisPrecedent, moisSuivant } from "@/types/suivi";
import { formatMois } from "@/lib/utils/format";

/** Construit l'URL du suivi avec mois + situation éventuelle. */
function lien(mois: string, situation?: SituationEcheance): string {
  const params = new URLSearchParams({ mois });
  if (situation) params.set("situation", situation);
  return `/paiements?${params.toString()}`;
}

/**
 * Filtres du suivi des loyers : navigation par mois + filtre par situation.
 * Server Component : tout passe par des liens (?mois=&situation=), l'état vit
 * dans l'URL (partageable, rechargeable).
 */
export default function FiltresSuivi({
  mois,
  situation,
}: {
  mois: string;
  situation?: SituationEcheance;
}) {
  const chipBase =
    "rounded-full px-3 py-1 text-sm font-medium transition-colors";
  const chipActif = "bg-blue-900 text-white";
  const chipInactif =
    "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900";

  return (
    <div className="space-y-3">
      {/* Navigation par mois */}
      <div className="flex items-center gap-3">
        <Link
          href={lien(moisPrecedent(mois), situation)}
          className="rounded-md border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          title="Mois précédent"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <span className="min-w-40 text-center text-sm font-medium capitalize text-zinc-900 dark:text-zinc-100">
          {formatMois(`${mois}-01`)}
        </span>
        <Link
          href={lien(moisSuivant(mois), situation)}
          className="rounded-md border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          title="Mois suivant"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Filtre par situation */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={lien(mois)}
          className={`${chipBase} ${!situation ? chipActif : chipInactif}`}
        >
          Tous
        </Link>
        {SITUATIONS_ECHEANCE.map((s) => (
          <Link
            key={s}
            href={lien(mois, s)}
            className={`${chipBase} ${situation === s ? chipActif : chipInactif}`}
          >
            {SITUATION_ECHEANCE_LABELS[s]}
          </Link>
        ))}
      </div>
    </div>
  );
}
