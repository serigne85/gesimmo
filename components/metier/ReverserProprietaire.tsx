"use client";

import { useActionState, useState } from "react";
import { Wallet } from "lucide-react";
import { MODES_PAIEMENT, MODE_PAIEMENT_LABELS } from "@/types/bail";
import { montantReverse } from "@/types/reversement";
import {
  creerReversementProprietaire,
  type ReversementState,
} from "@/services/reversements-actions";
import { formatFcfa } from "@/lib/utils/format";
import { champClasse, labelClasse } from "./champsBien";

const initialState: ReversementState = { error: null };

/**
 * Bouton « Reverser » qui déplie le formulaire de reversement d'un propriétaire.
 * Loyer et commission sont pré-remplis avec les totaux du mois (éditables) ; le
 * net (loyer − commission) se recalcule en direct. Le mois est fixé par la page.
 */
export default function ReverserProprietaire({
  proprietaireId,
  mois,
  encaisse,
  commission: commissionInitiale,
  aujourdhui,
}: {
  proprietaireId: string;
  mois: string;
  encaisse: number;
  commission: number;
  aujourdhui: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [state, formAction, isPending] = useActionState(
    creerReversementProprietaire.bind(null, proprietaireId),
    initialState
  );
  const [loyer, setLoyer] = useState(String(encaisse));
  const [commission, setCommission] = useState(String(commissionInitiale));
  const net = montantReverse(Number(loyer) || 0, Number(commission) || 0);

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
      >
        <Wallet className="h-4 w-4" aria-hidden="true" />
        Reverser
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="w-full space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40"
    >
      <input type="hidden" name="periode" value={mois} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`loyer-${proprietaireId}`} className={labelClasse}>
            Loyer encaissé (FCFA)
          </label>
          <input
            id={`loyer-${proprietaireId}`}
            name="montantLoyer"
            type="number"
            min="0"
            step="1"
            required
            value={loyer}
            onChange={(e) => setLoyer(e.target.value)}
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor={`commission-${proprietaireId}`} className={labelClasse}>
            Commission agence (FCFA)
          </label>
          <input
            id={`commission-${proprietaireId}`}
            name="commission"
            type="number"
            min="0"
            step="1"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            className={champClasse}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md bg-white px-3 py-2 dark:bg-zinc-900">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Net à reverser
        </span>
        <span className="text-sm font-semibold text-green-700 dark:text-green-400">
          {formatFcfa(net)}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`date-${proprietaireId}`} className={labelClasse}>
            Date du reversement
          </label>
          <input
            id={`date-${proprietaireId}`}
            name="dateReversement"
            type="date"
            required
            defaultValue={aujourdhui}
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor={`mode-${proprietaireId}`} className={labelClasse}>
            Mode de reversement
          </label>
          <select
            id={`mode-${proprietaireId}`}
            name="mode"
            required
            defaultValue="virement"
            className={champClasse}
          >
            {MODES_PAIEMENT.map((m) => (
              <option key={m} value={m}>
                {MODE_PAIEMENT_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={`note-${proprietaireId}`} className={labelClasse}>
          Note <span className="text-zinc-400">(optionnel)</span>
        </label>
        <input id={`note-${proprietaireId}`} name="note" className={champClasse} />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
        >
          {isPending ? "Enregistrement…" : "Enregistrer le reversement"}
        </button>
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
