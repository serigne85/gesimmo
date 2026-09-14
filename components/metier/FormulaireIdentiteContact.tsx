"use client";

import { useActionState } from "react";
import type { ContactIdentite } from "@/types/contact";
import {
  modifierIdentiteContact,
  type IdentiteContactState,
} from "@/services/contacts-actions";
import { champClasse, labelClasse } from "./champsBien";

const initialState: IdentiteContactState = { error: null };

/**
 * Édition de l'identité civile d'un contact (nom + naissance + CNI), pour les
 * contrats. Le téléphone (clé naturelle) est affiché mais non modifiable.
 */
export default function FormulaireIdentiteContact({
  contact,
}: {
  contact: ContactIdentite;
}) {
  const action = modifierIdentiteContact.bind(null, contact.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="nomComplet" className={labelClasse}>
          Nom complet
        </label>
        <input
          id="nomComplet"
          name="nomComplet"
          type="text"
          required
          maxLength={150}
          defaultValue={contact.nomComplet}
          className={champClasse}
        />
      </div>

      <div>
        <span className={labelClasse}>Téléphone</span>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {contact.telephone}{" "}
          <span className="text-xs text-zinc-400">(non modifiable)</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="dateNaissance" className={labelClasse}>
            Date de naissance <span className="text-zinc-400">(optionnel)</span>
          </label>
          <input
            id="dateNaissance"
            name="dateNaissance"
            type="date"
            defaultValue={contact.dateNaissance ?? ""}
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor="lieuNaissance" className={labelClasse}>
            Lieu de naissance <span className="text-zinc-400">(optionnel)</span>
          </label>
          <input
            id="lieuNaissance"
            name="lieuNaissance"
            type="text"
            maxLength={120}
            defaultValue={contact.lieuNaissance ?? ""}
            className={champClasse}
          />
        </div>
      </div>

      <div className="sm:w-1/2">
        <label htmlFor="cni" className={labelClasse}>
          N° de pièce d&apos;identité / CNI{" "}
          <span className="text-zinc-400">(optionnel)</span>
        </label>
        <input
          id="cni"
          name="cni"
          type="text"
          maxLength={40}
          defaultValue={contact.cni ?? ""}
          className={champClasse}
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
        className="w-full rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Enregistrement…" : "Enregistrer l'identité"}
      </button>
    </form>
  );
}
