import { getSuiviLoyers } from "@/services/suivi-loyers";
import {
  SITUATIONS_ECHEANCE,
  type SituationEcheance,
} from "@/types/echeance";
import { moisCourant } from "@/types/suivi";
import { formatFcfa } from "@/lib/utils/format";
import FiltresSuivi from "@/components/metier/FiltresSuivi";
import LigneSuiviLoyer from "@/components/metier/LigneSuiviLoyer";

/**
 * Suivi des loyers : toutes les échéances d'un mois, retards en évidence, actions
 * rapides et relances. Server Component ; l'état (mois, situation) vit dans l'URL.
 */
export default async function PaiementsPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string; situation?: string }>;
}) {
  const { mois: moisParam, situation: situationParam } = await searchParams;

  // Mois valide (AAAA-MM), sinon mois courant.
  const mois = /^\d{4}-\d{2}$/.test(moisParam ?? "") ? moisParam! : moisCourant();
  const situation = SITUATIONS_ECHEANCE.includes(situationParam as SituationEcheance)
    ? (situationParam as SituationEcheance)
    : undefined;

  const { rows, totaux } = await getSuiviLoyers(mois, situation);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Suivi des loyers
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Échéances du mois, retards et relances
        </p>
      </div>

      {/* Totaux du mois */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tuile label="Dû" valeur={formatFcfa(totaux.du)} />
        <Tuile label="Encaissé" valeur={formatFcfa(totaux.regle)} />
        <Tuile label="Reste" valeur={formatFcfa(totaux.reste)} />
        <Tuile
          label={`En retard (${totaux.nbEnRetard})`}
          valeur={formatFcfa(totaux.montantEnRetard)}
          accent={totaux.montantEnRetard > 0 ? "text-red-600 dark:text-red-400" : undefined}
        />
      </div>

      <FiltresSuivi mois={mois} situation={situation} />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Aucune échéance pour ce mois avec ce filtre.
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {rows.map((ligne) => (
            <LigneSuiviLoyer key={ligne.echeanceId} ligne={ligne} />
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
