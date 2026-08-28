import Link from "next/link";
import {
  situationEcheance,
  resteEcheance,
  type EcheanceLoyer,
} from "@/types/echeance";
import { formatFcfa, formatMois, formatDate } from "@/lib/utils/format";
import BadgeSituationEcheance from "./BadgeSituationEcheance";

/**
 * Échéances de loyer d'un bail. Server Component : la situation (à venir /
 * en retard / payé) est calculée par le service `situationEcheance`, jamais dans
 * le JSX. `aujourdhui` vient du serveur (Africa/Dakar).
 */
export default function TableauEcheances({
  echeances,
  aujourdhui,
}: {
  echeances: EcheanceLoyer[];
  aujourdhui: string;
}) {
  if (echeances.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Aucune échéance. Elles seront générées à l&apos;activation du bail.
      </p>
    );
  }

  const situations = echeances.map((e) =>
    situationEcheance(e.statut, e.dateEcheance, aujourdhui)
  );
  const enRetard = echeances.filter((_, i) => situations[i] === "en_retard");
  const totalRetard = enRetard.reduce((s, e) => s + e.montantDu, 0);

  return (
    <div className="space-y-3">
      {enRetard.length > 0 && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {enRetard.length} échéance{enRetard.length > 1 ? "s" : ""} en retard ·{" "}
          {formatFcfa(totalRetard)} à recouvrer
        </p>
      )}

      <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {echeances.map((e, i) => {
          const reste = resteEcheance(e.montantDu, e.montantRegle);
          return (
            <li key={e.id}>
              <Link
                href={`/gestion-locative/echeance/${e.id}`}
                className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium capitalize text-zinc-900 dark:text-zinc-100">
                    {formatMois(e.periode)}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Échéance le {formatDate(e.dateEcheance)}
                    {e.montantRegle > 0 && reste > 0
                      ? ` · reste ${formatFcfa(reste)}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {formatFcfa(e.montantDu)}
                  </span>
                  <BadgeSituationEcheance situation={situations[i]} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
