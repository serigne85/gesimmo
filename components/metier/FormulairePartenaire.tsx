"use client";

import { useActionState, useState } from "react";
import {
  TYPES_PARTENAIRE,
  TYPE_PARTENAIRE_LABELS,
  type TypePartenaire,
  type PartenaireEdition,
} from "@/types/partenaire";
import {
  creerPartenaire,
  modifierPartenaire,
  type PartenaireState,
} from "@/services/partenaires-actions";
import { champClasse, labelClasse } from "./champsBien";

const initialState: PartenaireState = { error: null };

/**
 * Formulaire partenaire, deux modes : `partenaire` absent = création, présent =
 * édition (le champ actif/inactif n'apparaît qu'en édition). Seul le nom est
 * obligatoire, le type a 4 options → boutons (CLAUDE.md).
 */
export default function FormulairePartenaire({
  partenaire,
}: {
  partenaire?: PartenaireEdition;
}) {
  const isEdition = !!partenaire;
  const action = isEdition
    ? modifierPartenaire.bind(null, partenaire.id)
    : creerPartenaire;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [type, setType] = useState<TypePartenaire>(
    partenaire?.type ?? "agence"
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="nom" className={labelClasse}>
          Nom du partenaire
        </label>
        <input
          id="nom"
          name="nom"
          type="text"
          required
          maxLength={150}
          defaultValue={partenaire?.nom ?? ""}
          className={champClasse}
        />
      </div>

      {/* Type : 4 options → boutons */}
      <div>
        <span className={labelClasse}>Type</span>
        <input type="hidden" name="type" value={type} />
        <div className="flex flex-wrap gap-2">
          {TYPES_PARTENAIRE.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setType(val)}
              className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                type === val
                  ? "border-blue-700 bg-blue-900 text-white"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              {TYPE_PARTENAIRE_LABELS[val]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="telephone" className={labelClasse}>
            Téléphone <span className="text-zinc-400">(optionnel)</span>
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            maxLength={30}
            defaultValue={partenaire?.telephone ?? ""}
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClasse}>
            E-mail <span className="text-zinc-400">(optionnel)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            maxLength={150}
            defaultValue={partenaire?.email ?? ""}
            className={champClasse}
          />
        </div>
      </div>

      <div>
        <label htmlFor="tauxCommissionDefaut" className={labelClasse}>
          Taux de commission habituel (%){" "}
          <span className="text-zinc-400">(optionnel)</span>
        </label>
        <input
          id="tauxCommissionDefaut"
          name="tauxCommissionDefaut"
          type="number"
          min="0"
          max="100"
          step="0.5"
          defaultValue={partenaire?.tauxCommissionDefaut ?? ""}
          className={champClasse}
        />
      </div>

      <div>
        <label htmlFor="notes" className={labelClasse}>
          Notes <span className="text-zinc-400">(zones couvertes, spécialités…)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={partenaire?.notes ?? ""}
          className={champClasse}
        />
      </div>

      {/* Actif : édition seulement */}
      {isEdition && (
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            name="actif"
            value="true"
            defaultChecked={partenaire.actif}
            className="h-4 w-4 rounded border-zinc-300 text-blue-900 focus:ring-blue-600"
          />
          Partenaire actif
        </label>
      )}

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
        className="w-full rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60 sm:w-auto"
      >
        {isPending
          ? "Enregistrement…"
          : isEdition
            ? "Enregistrer les modifications"
            : "Enregistrer le partenaire"}
      </button>
    </form>
  );
}
