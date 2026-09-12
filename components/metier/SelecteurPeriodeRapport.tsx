import Link from "next/link";
import { presetsPeriode, type RapportPeriode } from "@/types/rapport";

/**
 * Choix de la période d'un rapport : trois présélections (boutons) et un choix
 * libre par deux champs mois. Composant serveur — le formulaire est un GET natif
 * qui recharge la page avec ?debut=&fin=, sans JavaScript client.
 */
export default function SelecteurPeriodeRapport({
  periode,
}: {
  periode: RapportPeriode;
}) {
  const presets = presetsPeriode();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      {/* Présélections */}
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const actif =
            p.periode.debut === periode.debut && p.periode.fin === periode.fin;
          return (
            <Link
              key={p.cle}
              href={`/rapports?debut=${p.periode.debut}&fin=${p.periode.fin}`}
              className={
                actif
                  ? "rounded-md bg-blue-700 px-3 py-1.5 text-sm font-medium text-white"
                  : "rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }
            >
              {p.label}
            </Link>
          );
        })}
      </div>

      {/* Choix libre */}
      <form method="get" className="flex items-end gap-2">
        <label className="flex flex-col text-xs text-zinc-500 dark:text-zinc-400">
          Du
          <input
            type="month"
            name="debut"
            defaultValue={periode.debut}
            className="mt-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="flex flex-col text-xs text-zinc-500 dark:text-zinc-400">
          Au
          <input
            type="month"
            name="fin"
            defaultValue={periode.fin}
            className="mt-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <button
          type="submit"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Appliquer
        </button>
      </form>
    </div>
  );
}
