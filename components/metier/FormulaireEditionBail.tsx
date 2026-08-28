"use client";

import { useActionState } from "react";
import { modifierBail, type CreerBailState } from "@/services/baux-actions";
import { labelClasse } from "./champsBien";
import ChampsBail, { type DefautsBail } from "./ChampsBail";

const initialState: CreerBailState = { error: null };

/**
 * Formulaire d'édition d'un bail (statut brouillon). Le bien et le locataire ne
 * sont pas modifiables ici — ils sont affichés en lecture seule ; on ne corrige
 * que les conditions (loyer, charges, dates…) avant activation.
 */
export default function FormulaireEditionBail({
  bailId,
  bienLabel,
  locataireNom,
  defauts,
}: {
  bailId: string;
  bienLabel: string;
  locataireNom: string;
  defauts: DefautsBail;
}) {
  const [state, formAction, isPending] = useActionState(
    modifierBail.bind(null, bailId),
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      {/* Contexte non modifiable */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className={labelClasse}>Bien loué</span>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{bienLabel}</p>
        </div>
        <div>
          <span className={labelClasse}>Locataire</span>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{locataireNom}</p>
        </div>
      </div>

      <ChampsBail defauts={defauts} />

      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Enregistrement…" : "Enregistrer les modifications"}
      </button>
    </form>
  );
}
