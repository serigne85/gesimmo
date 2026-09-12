import type { RepartitionLigne } from "@/types/rapport";

/**
 * Carte de répartition : une liste de segments avec effectif, part et barre de
 * proportion. La barre est en pur CSS (largeur = part du total) — pas de
 * bibliothèque de graphiques. Accent bleu profond (code couleur CLAUDE.md).
 */
export default function CarteRepartition({
  titre,
  lignes,
  total,
}: {
  titre: string;
  lignes: RepartitionLigne[];
  total: number;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {titre}
      </p>
      {lignes.length === 0 ? (
        <p className="text-sm text-zinc-400">Aucun bien.</p>
      ) : (
        <ul className="space-y-2.5">
          {lignes.map((l) => {
            const part = total > 0 ? Math.round((l.nombre / total) * 100) : 0;
            return (
              <li key={l.cle} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-zinc-700 dark:text-zinc-300">
                    {l.label}
                  </span>
                  <span className="shrink-0 tabular-nums text-zinc-900 dark:text-zinc-100">
                    {l.nombre}
                    <span className="ml-1 text-xs text-zinc-400">{part} %</span>
                  </span>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                  role="presentation"
                >
                  <div
                    className="h-full rounded-full bg-blue-700 dark:bg-blue-500"
                    style={{ width: `${part}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
