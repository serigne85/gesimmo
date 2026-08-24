"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { connexion, type ConnexionState } from "@/services/auth-actions";

const initialState: ConnexionState = { error: null };

/**
 * Écran de connexion.
 *
 * useActionState(action, initialState) relie un formulaire à une Server Action :
 *  - `formAction` se branche sur <form action={...}>
 *  - `state` reçoit ce que l'action retourne (ici le message d'erreur)
 *  - `isPending` vaut true pendant l'envoi (pour désactiver le bouton)
 * Aucune logique métier ici : le composant se contente d'afficher.
 */
export default function ConnexionPage() {
  const [state, formAction, isPending] = useActionState(connexion, initialState);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-blue-900 dark:text-blue-300">
          M2S IMMO
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Connexion à votre espace
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Adresse e-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
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
          className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {isPending ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
