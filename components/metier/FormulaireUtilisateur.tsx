"use client";

import { useActionState, useEffect } from "react";
import { ROLES, ROLE_LABELS } from "@/types/roles";
import {
  creerUtilisateur,
  type CreerUtilisateurState,
} from "@/services/utilisateurs-actions";

const initialState: CreerUtilisateurState = { error: null, success: null };

type Props = {
  /** Appelé après une création réussie (pour refermer le formulaire). */
  onSuccess?: () => void;
};

/**
 * Formulaire de création d'un utilisateur. Client Component (formulaire
 * interactif) relié à la Server Action via useActionState. Aucune logique
 * métier ici : elle est entièrement dans l'action serveur.
 */
export default function FormulaireUtilisateur({ onSuccess }: Props) {
  const [state, formAction, isPending] = useActionState(
    creerUtilisateur,
    initialState
  );

  // Quand la création réussit, on prévient le parent (fermeture + message).
  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state.success, onSuccess]);

  const champClasse =
    "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
  const labelClasse =
    "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nomComplet" className={labelClasse}>
            Nom complet
          </label>
          <input id="nomComplet" name="nomComplet" type="text" required className={champClasse} />
        </div>
        <div>
          <label htmlFor="email" className={labelClasse}>
            Adresse e-mail
          </label>
          <input id="email" name="email" type="email" required className={champClasse} />
        </div>
        <div>
          <label htmlFor="role" className={labelClasse}>
            Rôle
          </label>
          <select id="role" name="role" required defaultValue="agent" className={champClasse}>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="password" className={labelClasse}>
            Mot de passe initial
          </label>
          <input
            id="password"
            name="password"
            type="text"
            required
            minLength={8}
            placeholder="8 caractères minimum"
            className={champClasse}
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
        >
          {isPending ? "Création…" : "Créer l'utilisateur"}
        </button>
      </div>
    </form>
  );
}
