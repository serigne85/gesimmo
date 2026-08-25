import Link from "next/link";
import { TYPE_BIEN_LABELS } from "@/types/bien";
import type { BienCorrespondant } from "@/types/demande";
import { formatFcfa } from "@/lib/utils/format";
import BadgeStatutBien from "./BadgeStatutBien";

/**
 * Liste des biens correspondant à une demande (résultat de matching), en lignes
 * bordées cliquables vers la fiche du bien.
 */
export default function BiensCorrespondants({
  biens,
}: {
  biens: BienCorrespondant[];
}) {
  if (biens.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Aucun bien du portefeuille ne correspond pour l&apos;instant.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {biens.map((b) => {
        const lieu = [b.zoneNom, b.villeNom].filter(Boolean).join(", ");
        return (
          <li key={b.id}>
            <Link
              href={`/biens/${b.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {b.reference}
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {b.titre || TYPE_BIEN_LABELS[b.type]}
                  </span>
                  <BadgeStatutBien statut={b.statut} />
                </div>
                <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
                  {TYPE_BIEN_LABELS[b.type]}
                  {lieu && ` · ${lieu}`}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {formatFcfa(b.prix)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
