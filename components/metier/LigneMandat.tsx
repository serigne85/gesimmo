import { Star } from "lucide-react";
import {
  TYPE_MANDAT_LABELS,
  formatCommission,
  type MandatListe,
} from "@/types/mandat";
import { formatDate } from "@/lib/utils/format";
import BadgeStatutMandat from "./BadgeStatutMandat";

/**
 * Une ligne de la liste des mandats. Server Component : pas d'interactivité.
 * (Le clic vers la fiche viendra avec l'étape « fiche détail ».)
 */
export default function LigneMandat({ mandat }: { mandat: MandatListe }) {
  const periode = [mandat.dateDebut, mandat.dateFin]
    .map((d) => (d ? formatDate(d) : null))
    .filter(Boolean)
    .join(" → ");

  return (
    <li className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {mandat.reference}
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {TYPE_MANDAT_LABELS[mandat.type]}
          </span>
          {mandat.exclusif && (
            <span
              className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-500"
              title="Mandat exclusif"
            >
              <Star className="h-3.5 w-3.5" aria-hidden="true" />
              Exclusif
            </span>
          )}
          <BadgeStatutMandat statut={mandat.statut} />
        </div>
        <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
          {mandat.bienReference}
          {mandat.bienTitre ? ` · ${mandat.bienTitre}` : ""} · {mandat.mandantNom}
        </p>
      </div>

      <div className="text-sm text-zinc-500 sm:text-right dark:text-zinc-400">
        <p>{formatCommission(mandat.commissionValeur, mandat.commissionUnite)}</p>
        {periode && <p className="text-xs">{periode}</p>}
      </div>
    </li>
  );
}
