"use client";

import { useActionState, useState } from "react";
import { STATUT_BAIL_LABELS, type StatutBail } from "@/types/bail";
import {
  transitionsPossibles,
  STATUTS_A_CONFIRMER,
} from "@/services/statuts-bail";
import { changerStatutBail } from "@/services/baux-actions";
import { champClasse } from "./champsBien";

/**
 * Changement de statut d'un bail via liste déroulante. Les cibles proposées
 * viennent de la machine à états (services/statuts-bail) ; le serveur revalide
 * de toute façon. Confirmation demandée pour les transitions lourdes.
 */
export default function ActionsStatutBail({
  id,
  statut,
}: {
  id: string;
  statut: StatutBail;
}) {
  const cibles = transitionsPossibles(statut);
  const [cible, setCible] = useState<StatutBail | "">("");
  const [state, formAction, isPending] = useActionState(
    changerStatutBail.bind(null, id),
    { error: null }
  );

  if (cibles.length === 0) return null;

  return (
    <form
      action={formAction}
      className="space-y-3"
      onSubmit={(e) => {
        if (!cible) {
          e.preventDefault();
          return;
        }
        if (
          STATUTS_A_CONFIRMER.includes(cible) &&
          !confirm(`Passer ce bail au statut « ${STATUT_BAIL_LABELS[cible]} » ?`)
        ) {
          e.preventDefault();
        }
      }}
    >
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Faire évoluer le statut
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          name="cible"
          required
          value={cible}
          onChange={(e) => setCible(e.target.value as StatutBail)}
          className={`${champClasse} sm:max-w-xs`}
        >
          <option value="" disabled>
            Choisir un nouveau statut…
          </option>
          {cibles.map((c) => (
            <option key={c} value={c}>
              {STATUT_BAIL_LABELS[c]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending || !cible}
          className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
        >
          {isPending ? "Application…" : "Appliquer"}
        </button>
      </div>
      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {state.error}
        </p>
      )}
    </form>
  );
}
