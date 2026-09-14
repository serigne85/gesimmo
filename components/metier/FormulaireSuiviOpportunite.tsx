"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  ajouterSuiviOpportunite,
  type OpportuniteActionState,
} from "@/services/opportunites-actions";
import {
  TYPES_SUIVI_SAISISSABLES,
  TYPE_SUIVI_LABELS,
} from "@/types/opportunite";
import { champClasse, labelClasse } from "./champsBien";

const initialState: OpportuniteActionState = { error: null };

/**
 * Ajout d'un événement au journal de suivi (note, appel, visite, offre). Le
 * champ se vide après un enregistrement réussi. L'action est liée à l'id de
 * l'opportunité via .bind.
 */
export default function FormulaireSuiviOpportunite({
  opportuniteId,
}: {
  opportuniteId: string;
}) {
  const action = ajouterSuiviOpportunite.bind(null, opportuniteId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Réinitialise le champ après un envoi réussi (pas d'erreur, plus en cours).
  useEffect(() => {
    if (!isPending && !state.error) formRef.current?.reset();
  }, [isPending, state.error]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="sm:w-40">
          <label htmlFor="type" className={labelClasse}>
            Type
          </label>
          <select id="type" name="type" defaultValue="note" className={champClasse}>
            {TYPES_SUIVI_SAISISSABLES.map((t) => (
              <option key={t} value={t}>
                {TYPE_SUIVI_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="description" className={labelClasse}>
            Événement
          </label>
          <input
            id="description"
            name="description"
            type="text"
            required
            placeholder="Ex. Appel : le client rappelle lundi"
            className={champClasse}
          />
        </div>
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        {isPending ? "Ajout…" : "Ajouter au journal"}
      </button>
    </form>
  );
}
