"use client";

import { useActionState } from "react";
import { MODES_PAIEMENT, MODE_PAIEMENT_LABELS } from "@/types/bail";
import {
  enregistrerPaiement,
  type PaiementState,
} from "@/services/paiements-actions";
import { champClasse, labelClasse } from "./champsBien";

const initialState: PaiementState = { error: null };

/**
 * Formulaire d'encaissement d'un paiement sur une échéance. Le montant est
 * pré-rempli avec le reste à payer (modifiable, pour gérer les paiements
 * partiels ou un trop-perçu). `aujourdhui` vient du serveur (Africa/Dakar).
 */
export default function FormulairePaiement({
  echeanceId,
  resteSuggere,
  aujourdhui,
}: {
  echeanceId: string;
  resteSuggere: number;
  aujourdhui: string;
}) {
  const [state, formAction, isPending] = useActionState(
    enregistrerPaiement.bind(null, echeanceId),
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="montant" className={labelClasse}>
            Montant (FCFA)
          </label>
          <input
            id="montant"
            name="montant"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={resteSuggere > 0 ? resteSuggere : ""}
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor="datePaiement" className={labelClasse}>
            Date du paiement
          </label>
          <input
            id="datePaiement"
            name="datePaiement"
            type="date"
            required
            defaultValue={aujourdhui}
            className={champClasse}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="mode" className={labelClasse}>
            Mode de paiement
          </label>
          <select id="mode" name="mode" required defaultValue="especes" className={champClasse}>
            {MODES_PAIEMENT.map((m) => (
              <option key={m} value={m}>
                {MODE_PAIEMENT_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="referenceTransaction" className={labelClasse}>
            Référence <span className="text-zinc-400">(optionnel)</span>
          </label>
          <input
            id="referenceTransaction"
            name="referenceTransaction"
            placeholder="N° Wave / Orange Money…"
            className={champClasse}
          />
        </div>
      </div>

      <div>
        <label htmlFor="note" className={labelClasse}>
          Note <span className="text-zinc-400">(optionnel)</span>
        </label>
        <input id="note" name="note" className={champClasse} />
      </div>

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
        {isPending ? "Enregistrement…" : "Enregistrer le paiement"}
      </button>
    </form>
  );
}
