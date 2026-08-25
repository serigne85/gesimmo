"use client";

import { useActionState, useEffect, useRef } from "react";
import { KeyRound } from "lucide-react";
import {
  changerMotDePasse,
  type ChangerMotDePasseState,
} from "@/services/compte-actions";

const initialState: ChangerMotDePasseState = { error: null, success: null };

/**
 * Formulaire libre-service de changement de mot de passe.
 *
 * Client Component relié à la Server Action via useActionState. Aucune logique
 * métier ici : validation et mise à jour sont entièrement côté serveur. On vide
 * les champs après un succès pour ne pas laisser les mots de passe à l'écran.
 */
export default function FormulaireMotDePasse() {
  const [state, formAction, isPending] = useActionState(
    changerMotDePasse,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  const champClasse =
    "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
  const labelClasse =
    "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <form
      ref={formRef}
      action={formAction}
      className="max-w-md space-y-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div>
        <label htmlFor="motDePasseActuel" className={labelClasse}>
          Mot de passe actuel
        </label>
        <input
          id="motDePasseActuel"
          name="motDePasseActuel"
          type="password"
          autoComplete="current-password"
          required
          className={champClasse}
        />
      </div>

      <div>
        <label htmlFor="nouveauMotDePasse" className={labelClasse}>
          Nouveau mot de passe
        </label>
        <input
          id="nouveauMotDePasse"
          name="nouveauMotDePasse"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="8 caractères minimum"
          className={champClasse}
        />
      </div>

      <div>
        <label htmlFor="confirmation" className={labelClasse}>
          Confirmer le nouveau mot de passe
        </label>
        <input
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={champClasse}
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          {state.success}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
        >
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          {isPending ? "Mise à jour…" : "Changer le mot de passe"}
        </button>
      </div>
    </form>
  );
}
