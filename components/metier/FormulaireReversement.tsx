"use client";

import { useActionState, useMemo, useState } from "react";
import { MODES_PAIEMENT, MODE_PAIEMENT_LABELS } from "@/types/bail";
import { montantReverse } from "@/types/reversement";
import {
  creerReversement,
  type ReversementState,
} from "@/services/reversements-actions";
import { formatFcfa, formatMois } from "@/lib/utils/format";
import { champClasse, labelClasse } from "./champsBien";

const initialState: ReversementState = { error: null };

type MoisOption = { value: string; label: string; regle: number };

/**
 * Formulaire de reversement au propriétaire. Le loyer est pré-rempli avec le
 * montant encaissé du mois choisi ; la commission avec la suggestion du mandat de
 * gérance. Le net (loyer − commission) se recalcule en direct. Tout est éditable.
 */
export default function FormulaireReversement({
  bailId,
  echeances,
  commissionSuggeree,
  aujourdhui,
}: {
  bailId: string;
  echeances: { periode: string; montantRegle: number }[];
  commissionSuggeree: number;
  aujourdhui: string;
}) {
  const [state, formAction, isPending] = useActionState(
    creerReversement.bind(null, bailId),
    initialState
  );

  const options: MoisOption[] = useMemo(
    () =>
      echeances.map((e) => ({
        value: e.periode.slice(0, 7),
        label: formatMois(e.periode),
        regle: e.montantRegle,
      })),
    [echeances]
  );

  const [mois, setMois] = useState(options[options.length - 1]?.value ?? "");
  const [loyer, setLoyer] = useState(
    String(options[options.length - 1]?.regle ?? 0)
  );
  const [commission, setCommission] = useState(String(commissionSuggeree));

  function changerMois(value: string) {
    setMois(value);
    const opt = options.find((o) => o.value === value);
    if (opt) setLoyer(String(opt.regle));
  }

  const net = montantReverse(Number(loyer) || 0, Number(commission) || 0);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="periode" className={labelClasse}>
            Mois concerné
          </label>
          <select
            id="periode"
            name="periode"
            required
            value={mois}
            onChange={(e) => changerMois(e.target.value)}
            className={`${champClasse} capitalize`}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="dateReversement" className={labelClasse}>
            Date du reversement
          </label>
          <input
            id="dateReversement"
            name="dateReversement"
            type="date"
            required
            defaultValue={aujourdhui}
            className={champClasse}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="montantLoyer" className={labelClasse}>
            Loyer encaissé (FCFA)
          </label>
          <input
            id="montantLoyer"
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
          <label htmlFor="commission" className={labelClasse}>
            Commission agence (FCFA)
          </label>
          <input
            id="commission"
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

      <div className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Net à reverser
        </span>
        <span className="text-sm font-semibold text-green-700 dark:text-green-400">
          {formatFcfa(net)}
        </span>
      </div>

      <div>
        <label htmlFor="mode" className={labelClasse}>
          Mode de reversement
        </label>
        <select id="mode" name="mode" required defaultValue="virement" className={champClasse}>
          {MODES_PAIEMENT.map((m) => (
            <option key={m} value={m}>
              {MODE_PAIEMENT_LABELS[m]}
            </option>
          ))}
        </select>
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
        disabled={isPending || options.length === 0}
        className="w-full rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Enregistrement…" : "Enregistrer le reversement"}
      </button>
    </form>
  );
}
