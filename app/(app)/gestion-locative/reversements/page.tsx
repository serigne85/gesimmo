import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { getReversements } from "@/services/reversements";
import { moisCourant, moisPrecedent, moisSuivant } from "@/types/suivi";
import { formatFcfa, formatDate, formatMois } from "@/lib/utils/format";

/**
 * Vue globale des reversements aux propriétaires, mois par mois. Server Component
 * (RLS active) ; le mois vit dans l'URL (?mois=AAAA-MM).
 */
export default async function ReversementsPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  const { mois: moisParam } = await searchParams;
  const mois = /^\d{4}-\d{2}$/.test(moisParam ?? "") ? moisParam! : moisCourant();

  const { rows, totaux } = await getReversements(mois);

  return (
    <div className="space-y-4">
      <Link
        href="/gestion-locative"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Gestion locative
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Reversements aux propriétaires
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loyers reversés aux propriétaires, par mois
        </p>
      </div>

      {/* Totaux du mois */}
      <div className="grid grid-cols-3 gap-3">
        <Tuile label="Loyers encaissés" valeur={formatFcfa(totaux.loyer)} />
        <Tuile label="Commissions agence" valeur={formatFcfa(totaux.commission)} />
        <Tuile
          label="Net reversé"
          valeur={formatFcfa(totaux.reverse)}
          accent="text-green-700 dark:text-green-400"
        />
      </div>

      {/* Navigation par mois */}
      <div className="flex items-center gap-3">
        <Link
          href={`/gestion-locative/reversements?mois=${moisPrecedent(mois)}`}
          className="rounded-md border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          title="Mois précédent"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <span className="min-w-40 text-center text-sm font-medium capitalize text-zinc-900 dark:text-zinc-100">
          {formatMois(`${mois}-01`)}
        </span>
        <Link
          href={`/gestion-locative/reversements?mois=${moisSuivant(mois)}`}
          className="rounded-md border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          title="Mois suivant"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Aucun reversement pour ce mois.
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {rows.map((r) => (
            <li key={r.id} className="px-4 py-3">
              <Link
                href={`/gestion-locative/${r.bailId}`}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {r.proprietaireNom}
                  </p>
                  <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                    {r.bienReference}
                    {r.bienTitre ? ` · ${r.bienTitre}` : ""} · {r.bailReference} ·{" "}
                    {formatDate(r.dateReversement)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-700 dark:text-green-400">
                    {formatFcfa(r.montantReverse)}
                  </p>
                  <p className="text-xs text-zinc-400">
                    loyer {formatFcfa(r.montantLoyer)} · comm.{" "}
                    {formatFcfa(r.commission)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Une tuile de total du mois. */
function Tuile({
  label,
  valeur,
  accent,
}: {
  label: string;
  valeur: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${accent ?? "text-zinc-900 dark:text-zinc-100"}`}>
        {valeur}
      </p>
    </div>
  );
}
